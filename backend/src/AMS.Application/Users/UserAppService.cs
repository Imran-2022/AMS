using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class UserAppService : IUserAppService
{
    private readonly IUserRepository _userRepository;
    private readonly IFileAppService _fileAppService;
    private readonly IStudentEnrollmentRepository _enrollmentRepository;
    private readonly IClassCourseRepository _classCourseRepository;

    public UserAppService(
        IUserRepository userRepository,
        IFileAppService fileAppService,
        IStudentEnrollmentRepository enrollmentRepository,
        IClassCourseRepository classCourseRepository)
    {
        _userRepository = userRepository;
        _fileAppService = fileAppService;
        _enrollmentRepository = enrollmentRepository;
        _classCourseRepository = classCourseRepository;
    }

    private static DateTime? NormalizeDateTimeUtc(DateTime? value)
        => value is null
            ? null
            : value.Value.Kind switch
            {
                DateTimeKind.Local => value.Value.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(value.Value, DateTimeKind.Utc),
                _ => value.Value,
            };

    public async Task<IReadOnlyList<UserDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        var users = await _userRepository.GetAllAsync(cancellationToken);
        return users.Select(ToDto).ToList();
    }

    public async Task<UserDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin) && id != currentUserId) throw new ForbiddenException("Only admins can manage users.");
        var user = await _userRepository.GetByIdAsync(id, cancellationToken);
        return user is null ? null : ToDto(user);
    }

    public async Task<UserDto> CreateAsync(CreateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        if (!Enum.TryParse<UserRole>(input.Role, true, out var role)) throw new ValidationException("Invalid role.");

        // Validate gender when provided: only allow Male or Female
        if (!string.IsNullOrWhiteSpace(input.Gender))
        {
            var g = input.Gender.Trim().ToLowerInvariant();
            if (g != "male" && g != "female") throw new ValidationException("Invalid gender. Allowed values: Male, Female.");
        }

        // Auto-generate EmployeeId for teachers when not provided
        var employeeId = input.EmployeeId;
        if (role == UserRole.Teacher && string.IsNullOrWhiteSpace(employeeId))
        {
            employeeId = $"EMP-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
        }

        var userId = Guid.NewGuid();

        TeacherProfile? teacherProfile = null;
        if (role == UserRole.Teacher)
        {
            if (string.IsNullOrWhiteSpace(employeeId)) throw new ValidationException("EmployeeId is required for teacher.");
            if (string.IsNullOrWhiteSpace(input.SubjectSpecialization)) throw new ValidationException("Subject specialization is required for teacher.");
            if (string.IsNullOrWhiteSpace(input.Qualification)) throw new ValidationException("Qualification is required for teacher.");
            var joining = NormalizeDateTimeUtc(input.JoiningDate) ?? DateTime.UtcNow;
            teacherProfile = new TeacherProfile(userId, employeeId, input.SubjectSpecialization, input.Qualification, joining);
        }

        StudentProfile? studentProfile = null;
        if (role == UserRole.Student)
        {
            if (string.IsNullOrWhiteSpace(input.StudentId)) throw new ValidationException("StudentId is required for student.");
            if (string.IsNullOrWhiteSpace(input.GuardianName)) throw new ValidationException("Guardian name is required for student.");
            if (string.IsNullOrWhiteSpace(input.ParentMobile)) throw new ValidationException("Parent mobile is required for student.");
            var admission = NormalizeDateTimeUtc(input.AdmissionDate) ?? DateTime.UtcNow;
            studentProfile = new StudentProfile(userId, input.StudentId, input.GuardianName, input.GuardianEmail ?? string.Empty, input.ParentMobile, admission);
        }

        var user = new User(
            userId,
            input.FullName,
            input.Email,
            BCrypt.Net.BCrypt.HashPassword(input.Password),
            role,
            input.AvatarUrl ?? string.Empty,
            input.PhoneNumber ?? string.Empty,
            input.Gender ?? string.Empty,
            NormalizeDateTimeUtc(input.DateOfBirth),
            input.Address ?? string.Empty,
            input.IsActive,
            createdAt: null,
            updatedAt: null,
            teacherProfile: teacherProfile,
            studentProfile: studentProfile);

        await _userRepository.AddAsync(user, cancellationToken);
        return ToDto(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin) && id != currentUserId) throw new ForbiddenException("Only admins can manage other users.");
        var user = await _userRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("User not found.");
        // remember previous avatar stored file name so we can delete it after a successful update
        string? previousAvatarStoredFile = null;
        if (!string.IsNullOrWhiteSpace(user.AvatarUrl))
        {
            try
            {
                var parts = user.AvatarUrl.Split('/', StringSplitOptions.RemoveEmptyEntries);
                previousAvatarStoredFile = parts.Length > 0 ? parts[^1] : null;
            }
            catch
            {
                previousAvatarStoredFile = null;
            }
        }
        // Build updated scalar fields
        var newFullName = input.FullName ?? user.FullName;
        var newEmail = input.Email ?? user.Email;
        var newPasswordHash = input.Password is not null ? BCrypt.Net.BCrypt.HashPassword(input.Password) : user.PasswordHash;
        var newRole = user.Role;
        if (input.Role is not null && Enum.TryParse<UserRole>(input.Role, true, out var parsedRole)) newRole = parsedRole;
        var newAvatar = input.AvatarUrl ?? user.AvatarUrl;
        var newPhone = input.PhoneNumber ?? user.PhoneNumber;
        var newGender = input.Gender ?? user.Gender;
        if (!string.IsNullOrWhiteSpace(newGender))
        {
            var g = newGender.Trim().ToLowerInvariant();
            if (g != "male" && g != "female") throw new ValidationException("Invalid gender. Allowed values: Male, Female.");
        }
        var newDob = input.DateOfBirth is not null ? NormalizeDateTimeUtc(input.DateOfBirth) : user.DateOfBirth;
        var newAddress = input.Address ?? user.Address;
        var newIsActive = input.IsActive ?? user.IsActive;

        // Build teacher profile if applicable
        TeacherProfile? teacherProfile = null;
        if (newRole == UserRole.Teacher)
        {
            var emp = input.EmployeeId ?? user.EmployeeId;
            var subj = input.SubjectSpecialization ?? user.SubjectSpecialization;
            var qual = input.Qualification ?? user.Qualification;
            var joining = input.JoiningDate is not null ? NormalizeDateTimeUtc(input.JoiningDate)!.Value : user.JoiningDate ?? DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(emp) || string.IsNullOrWhiteSpace(subj) || string.IsNullOrWhiteSpace(qual))
            {
                if (user.TeacherProfile is not null)
                {
                    teacherProfile = user.TeacherProfile;
                }
                else
                {
                    throw new ValidationException("Teacher profile requires employee id, subject specialization and qualification.");
                }
            }
            else
            {
                teacherProfile = new TeacherProfile(user.Id, emp, subj, qual, joining);
            }
        }

        // Build student profile if applicable
        StudentProfile? studentProfile = null;
        if (newRole == UserRole.Student)
        {
            var sid = input.StudentId ?? user.StudentId;
            var gName = input.GuardianName ?? user.GuardianName;
            var gEmail = input.GuardianEmail ?? user.GuardianEmail;
            var pMobile = input.ParentMobile ?? user.ParentMobile;
            var admission = input.AdmissionDate is not null ? NormalizeDateTimeUtc(input.AdmissionDate)!.Value : user.AdmissionDate ?? DateTime.UtcNow;
            if (string.IsNullOrWhiteSpace(sid) || string.IsNullOrWhiteSpace(gName) || string.IsNullOrWhiteSpace(pMobile))
            {
                if (user.StudentProfile is not null)
                {
                    studentProfile = user.StudentProfile;
                }
                else
                {
                    throw new ValidationException("Student profile requires student id, guardian name and parent mobile.");
                }
            }
            else
            {
                studentProfile = new StudentProfile(user.Id, sid, gName, gEmail ?? string.Empty, pMobile, admission);
            }
        }

        var updatedUser = new User(user.Id, newFullName, newEmail, newPasswordHash, newRole, newAvatar, newPhone, newGender, newDob, newAddress, newIsActive, null, null, teacherProfile, studentProfile);
        await _userRepository.UpdateAsync(updatedUser, cancellationToken);

        // If avatar was changed, delete previous stored file to avoid orphaned uploads
        if (!string.IsNullOrWhiteSpace(previousAvatarStoredFile) && input.AvatarUrl is not null)
        {
            try
            {
                var newParts = input.AvatarUrl.Split('/', StringSplitOptions.RemoveEmptyEntries);
                var newStored = newParts.Length > 0 ? newParts[^1] : null;
                if (!string.IsNullOrWhiteSpace(newStored) && !string.Equals(newStored, previousAvatarStoredFile, StringComparison.OrdinalIgnoreCase))
                {
                    await _fileAppService.DeleteFileAsync(previousAvatarStoredFile);
                }
            }
            catch
            {
                // ignore deletion errors
            }
        }

        return ToDto(user);
    }

    public async Task<UserDto> ToggleActiveAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        var user = await _userRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("User not found.");
        user.ToggleActive();
        await _userRepository.UpdateAsync(user, cancellationToken);
        return ToDto(user);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        await _userRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<string> GetNextStudentIdAsync(Guid classCourseId, Guid? groupId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        
        // Get the class course to determine if it needs groups
        var classCourse = await _classCourseRepository.GetByIdAsync(classCourseId, cancellationToken) 
            ?? throw new NotFoundException("Class/course not found.");

        // Get all enrollments for this class
        var enrollments = await _enrollmentRepository.GetByClassCourseAsync(classCourseId, cancellationToken);

        // Filter by group if provided
        if (groupId.HasValue)
        {
            // Get only students in this specific group
            var groupEnrollments = new List<StudentEnrollment>();
            foreach (var enrollment in enrollments)
            {
                var user = await _userRepository.GetByIdAsync(enrollment.StudentId, cancellationToken);
                if (user?.Role == UserRole.Student && !string.IsNullOrWhiteSpace(user.StudentId))
                {
                    // Check if student ID matches group pattern (e.g., "9-S-001")
                    var parts = user.StudentId.Split('-');
                    if (parts.Length == 3 && parts[1].Length == 1)
                    {
                        groupEnrollments.Add(enrollment);
                    }
                }
            }
            enrollments = groupEnrollments;
        }

        // Get all student IDs for this class/group
        var studentIds = new List<string>();
        foreach (var enrollment in enrollments)
        {
            var user = await _userRepository.GetByIdAsync(enrollment.StudentId, cancellationToken);
            if (user?.Role == UserRole.Student && !string.IsNullOrWhiteSpace(user.StudentId))
            {
                studentIds.Add(user.StudentId);
            }
        }

        // Parse group if present to determine format
        if (groupId.HasValue)
        {
            // Format: "9-S-001" where 9 is class, S is group initial, 001 is sequence
            var classNumber = ExtractClassNumber(classCourse.Name);
            if (!string.IsNullOrWhiteSpace(classNumber))
            {
                // Get the group name (assuming it's passed or we fetch it)
                // For now, we'll generate based on max sequence in existing IDs
                var maxSequence = 0;
                foreach (var id in studentIds)
                {
                    var parts = id.Split('-');
                    if (parts.Length == 3 && int.TryParse(parts[2], out var seq))
                    {
                        maxSequence = Math.Max(maxSequence, seq);
                    }
                }
                
                // Extract group initial from first existing ID if available
                string groupInitial = "A";
                if (studentIds.Count > 0)
                {
                    var firstParts = studentIds[0].Split('-');
                    if (firstParts.Length == 3)
                    {
                        groupInitial = firstParts[1];
                    }
                }

                return $"{classNumber}-{groupInitial}-{(maxSequence + 1):D3}";
            }
        }
        else
        {
            // Format: "STU-0001"
            var maxValue = 0;
            foreach (var id in studentIds)
            {
                if (id.StartsWith("STU-") && int.TryParse(id.Substring(4), out var num))
                {
                    maxValue = Math.Max(maxValue, num);
                }
            }
            return $"STU-{(maxValue + 1):D4}";
        }

        throw new ValidationException("Unable to generate student ID for this class.");
    }

    private static string? ExtractClassNumber(string className)
    {
        return className switch
        {
            "Nine" => "9",
            "Ten" => "10",
            "Eleven" => "11",
            "Twelve" => "12",
            _ => null
        };
    }

    private static UserDto ToDto(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role.ToString(),
        IsActive = user.IsActive,
        AvatarUrl = user.AvatarUrl,
        PhoneNumber = user.PhoneNumber,
        EmployeeId = user.EmployeeId,
        SubjectSpecialization = user.SubjectSpecialization,
        Qualification = user.Qualification,
        GuardianName = user.GuardianName,
        GuardianEmail = user.GuardianEmail,
        Address = user.Address,
        StudentId = user.StudentId,
        Gender = user.Gender,
        DateOfBirth = user.DateOfBirth,
        AdmissionDate = user.AdmissionDate,
        JoiningDate = user.JoiningDate,
        ParentMobile = user.ParentMobile
    };
}

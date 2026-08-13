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
    private readonly IGroupRepository _groupRepository;

    public UserAppService(
        IUserRepository userRepository,
        IFileAppService fileAppService,
        IStudentEnrollmentRepository enrollmentRepository,
        IClassCourseRepository classCourseRepository,
        IGroupRepository groupRepository)
    {
        _userRepository = userRepository;
        _fileAppService = fileAppService;
        _enrollmentRepository = enrollmentRepository;
        _classCourseRepository = classCourseRepository;
        _groupRepository = groupRepository;
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
            if (string.IsNullOrWhiteSpace(input.Email)) throw new ValidationException("Email is required for student (needed for login).");
            if (string.IsNullOrWhiteSpace(input.StudentId)) throw new ValidationException("StudentId is required for student.");
            if (string.IsNullOrWhiteSpace(input.GuardianName)) throw new ValidationException("Guardian name is required for student.");
            if (string.IsNullOrWhiteSpace(input.ParentMobile)) throw new ValidationException("Parent mobile is required for student.");
            if (input.AdmissionDate == null) throw new ValidationException("Admission date is required for student.");
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

        return ToDto(updatedUser);
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

        var classCourse = await _classCourseRepository.GetByIdAsync(classCourseId, cancellationToken)
            ?? throw new NotFoundException("Class/course not found.");

        // A ClassCourse already represents one specific class + section + group
        // combination (see ClassCourse.GroupId), so every enrollment scoped to this
        // classCourseId already belongs to exactly the class/group being asked about.
        // No extra string-based filtering is needed (and the previous implementation's
        // heuristic of matching student-id string shape was unreliable and ignored
        // which group was actually selected).
        var enrollments = await _enrollmentRepository.GetByClassCourseAsync(classCourseId, cancellationToken);
        var nextSerial = enrollments.Count + 1;

        var effectiveGroupId = groupId ?? classCourse.GroupId;
        if (effectiveGroupId.HasValue)
        {
            var classNumber = ExtractClassNumber(classCourse.Name)
                ?? throw new ValidationException("Unable to generate a grouped student ID for this class.");

            var group = await _groupRepository.GetByIdAsync(effectiveGroupId.Value, cancellationToken)
                ?? throw new NotFoundException("Group not found.");

            var trimmedGroupName = group.Name.Trim();
            var groupInitial = trimmedGroupName.Length > 0
                ? char.ToUpperInvariant(trimmedGroupName[0]).ToString()
                : "G";

            // Format: "9-S-001" (class number - group initial - serial), serial is
            // simply "how many students are already enrolled in this exact class-course + 1".
            return $"{classNumber}-{groupInitial}-{nextSerial:D3}";
        }

        // No group for this class (classes 1-8): "STU-0001" sequential format.
        return $"STU-{nextSerial:D4}";
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
        ParentMobile = user.ParentMobile,
        CreatedAt = user.CreatedAt,
        UpdatedAt = user.UpdatedAt
    };
}

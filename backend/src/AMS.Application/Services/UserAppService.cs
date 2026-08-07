using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class UserAppService : IUserAppService
{
    private readonly IUserRepository _userRepository;

    public UserAppService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
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
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
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

        var user = new AppUser(
            Guid.NewGuid(),
            input.FullName,
            input.Email,
            BCrypt.Net.BCrypt.HashPassword(input.Password),
            role,
            input.AvatarUrl,
            input.PhoneNumber,
            employeeId,
            input.SubjectSpecialization,
            input.Qualification,
            input.GuardianName,
            input.GuardianEmail,
            input.Address,
            input.StudentId,
            input.Gender,
            NormalizeDateTimeUtc(input.DateOfBirth),
            NormalizeDateTimeUtc(input.AdmissionDate),
            NormalizeDateTimeUtc(input.JoiningDate),
            input.ParentMobile,
            input.IsActive);

        await _userRepository.AddAsync(user, cancellationToken);
        return ToDto(user);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin)) throw new ForbiddenException("Only admins can manage users.");
        var user = await _userRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("User not found.");
        if (input.FullName is not null) user = new AppUser(user.Id, input.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Email is not null) user = new AppUser(user.Id, user.FullName, input.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Role is not null && Enum.TryParse<UserRole>(input.Role, true, out var role)) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Password is not null) user = new AppUser(user.Id, user.FullName, user.Email, BCrypt.Net.BCrypt.HashPassword(input.Password), user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.AvatarUrl is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, input.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.PhoneNumber is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, input.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.EmployeeId is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, input.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.SubjectSpecialization is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, input.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Qualification is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, input.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.GuardianName is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, input.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.GuardianEmail is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, input.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Address is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, input.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.StudentId is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, input.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.Gender is not null)
        {
            var gender = input.Gender.Trim();
            if (!string.IsNullOrWhiteSpace(gender) && gender.ToLowerInvariant() != "male" && gender.ToLowerInvariant() != "female") throw new ValidationException("Invalid gender. Allowed values: Male, Female.");
            user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        }
        if (input.DateOfBirth is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, NormalizeDateTimeUtc(input.DateOfBirth), user.AdmissionDate, user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.AdmissionDate is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, NormalizeDateTimeUtc(input.AdmissionDate), user.JoiningDate, user.ParentMobile, user.IsActive);
        if (input.JoiningDate is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, NormalizeDateTimeUtc(input.JoiningDate), user.ParentMobile, user.IsActive);
        if (input.ParentMobile is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, input.ParentMobile, user.IsActive);
        if (input.IsActive is not null) user = new AppUser(user.Id, user.FullName, user.Email, user.PasswordHash, user.Role, user.AvatarUrl, user.PhoneNumber, user.EmployeeId, user.SubjectSpecialization, user.Qualification, user.GuardianName, user.GuardianEmail, user.Address, user.StudentId, user.Gender, user.DateOfBirth, user.AdmissionDate, user.JoiningDate, user.ParentMobile, input.IsActive.Value);
        await _userRepository.UpdateAsync(user, cancellationToken);
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

    private static UserDto ToDto(AppUser user) => new()
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

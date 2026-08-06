namespace AMS.Application.Contracts.Dtos;

public class UserDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public string AvatarUrl { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string SubjectSpecialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianEmail { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public DateTime? AdmissionDate { get; set; }
    public DateTime? JoiningDate { get; set; }
    public string ParentMobile { get; set; } = string.Empty;
}

public class CreateUserDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public string AvatarUrl { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public string SubjectSpecialization { get; set; } = string.Empty;
    public string Qualification { get; set; } = string.Empty;
    public string GuardianName { get; set; } = string.Empty;
    public string GuardianEmail { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public DateTime? AdmissionDate { get; set; }
    public DateTime? JoiningDate { get; set; }
    public string ParentMobile { get; set; } = string.Empty;
}

public class UpdateUserDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Role { get; set; }
    public bool? IsActive { get; set; }
    public string? AvatarUrl { get; set; }
    public string? PhoneNumber { get; set; }
    public string? EmployeeId { get; set; }
    public string? SubjectSpecialization { get; set; }
    public string? Qualification { get; set; }
    public string? GuardianName { get; set; }
    public string? GuardianEmail { get; set; }
    public string? Address { get; set; }
    public string? StudentId { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public DateTime? AdmissionDate { get; set; }
    public DateTime? JoiningDate { get; set; }
    public string? ParentMobile { get; set; }
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new UserDto();
}

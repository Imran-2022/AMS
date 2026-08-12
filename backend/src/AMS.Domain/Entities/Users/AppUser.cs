using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class User
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string PasswordHash { get; private set; } = null!;
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public string AvatarUrl { get; private set; }
    public string PhoneNumber { get; private set; }
    public string Gender { get; private set; }
    public DateTime? DateOfBirth { get; private set; }
    public string Address { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public TeacherProfile? TeacherProfile { get; private set; }
    public StudentProfile? StudentProfile { get; private set; }

    public string EmployeeId => TeacherProfile?.EmployeeId ?? string.Empty;
    public string SubjectSpecialization => TeacherProfile?.SubjectSpecialization ?? string.Empty;
    public string Qualification => TeacherProfile?.Qualification ?? string.Empty;
    public string StudentId => StudentProfile?.StudentId ?? string.Empty;
    public string GuardianName => StudentProfile?.GuardianName ?? string.Empty;
    public string GuardianEmail => StudentProfile?.GuardianEmail ?? string.Empty;
    public string ParentMobile => StudentProfile?.ParentMobile ?? string.Empty;
    public DateTime? AdmissionDate => StudentProfile?.AdmissionDate;
    public DateTime? JoiningDate => TeacherProfile?.JoiningDate;

    private User()
    {
        AvatarUrl = string.Empty;
        PhoneNumber = string.Empty;
        Gender = string.Empty;
        Address = string.Empty;
    }

    public User(
        Guid id,
        string fullName,
        string email,
        string passwordHash,
        UserRole role,
        string avatarUrl = "",
        string phoneNumber = "",
        string gender = "",
        DateTime? dateOfBirth = null,
        string address = "",
        bool isActive = true,
        DateTime? createdAt = null,
        DateTime? updatedAt = null,
        TeacherProfile? teacherProfile = null,
        StudentProfile? studentProfile = null)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        if (string.IsNullOrWhiteSpace(email)) throw new DomainException("Email is required.");
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new DomainException("Password hash is required.");
        if (teacherProfile is not null && teacherProfile.UserId != id) throw new DomainException("Teacher profile user id must match user id.");
        if (studentProfile is not null && studentProfile.UserId != id) throw new DomainException("Student profile user id must match user id.");

        Id = id;
        FullName = fullName;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        AvatarUrl = avatarUrl ?? string.Empty;
        PhoneNumber = phoneNumber ?? string.Empty;
        Gender = gender ?? string.Empty;
        DateOfBirth = dateOfBirth;
        Address = address ?? string.Empty;
        IsActive = isActive;
        if (createdAt.HasValue)
        {
            CreatedAt = createdAt.Value.Kind switch
            {
                DateTimeKind.Local => createdAt.Value.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(createdAt.Value, DateTimeKind.Utc),
                _ => createdAt.Value
            };
        }
        else
        {
            CreatedAt = DateTime.UtcNow;
        }
        UpdatedAt = updatedAt;
        TeacherProfile = teacherProfile;
        StudentProfile = studentProfile;
    }

    public void ToggleActive()
    {
        IsActive = !IsActive;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateProfile(string fullName, string parentMobile)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        FullName = fullName;
        if (StudentProfile is not null)
        {
            StudentProfile.UpdateParentMobile(parentMobile);
        }
        UpdatedAt = DateTime.UtcNow;
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash)) throw new DomainException("Password hash is required.");
        PasswordHash = newPasswordHash;
        UpdatedAt = DateTime.UtcNow;
    }

    public void SetUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

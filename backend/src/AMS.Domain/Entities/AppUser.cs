using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class AppUser
{
    public Guid Id { get; private set; }
    public string FullName { get; private set; }
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public UserRole Role { get; private set; }
    public bool IsActive { get; private set; }
    public string AvatarUrl { get; private set; }
    public string PhoneNumber { get; private set; }
    public string EmployeeId { get; private set; }
    public string SubjectSpecialization { get; private set; }
    public string Qualification { get; private set; }
    public string GuardianName { get; private set; }
    public string GuardianEmail { get; private set; }
    public string Address { get; private set; }
    public string StudentId { get; private set; }
    public string Gender { get; private set; }
    public DateTime? DateOfBirth { get; private set; }
    public DateTime? AdmissionDate { get; private set; }
    public DateTime? JoiningDate { get; private set; }
    public string ParentMobile { get; private set; }

    private AppUser()
    {
        AvatarUrl = string.Empty;
        PhoneNumber = string.Empty;
        EmployeeId = string.Empty;
        SubjectSpecialization = string.Empty;
        Qualification = string.Empty;
        GuardianName = string.Empty;
        GuardianEmail = string.Empty;
        Address = string.Empty;
        StudentId = string.Empty;
        Gender = string.Empty;
        ParentMobile = string.Empty;
    }

    public AppUser(Guid id, string fullName, string email, string passwordHash, UserRole role, string avatarUrl = "", string phoneNumber = "", string employeeId = "", string subjectSpecialization = "", string qualification = "", string guardianName = "", string guardianEmail = "", string address = "", string studentId = "", string gender = "", DateTime? dateOfBirth = null, DateTime? admissionDate = null, DateTime? joiningDate = null, string parentMobile = "", bool isActive = true)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        if (string.IsNullOrWhiteSpace(email)) throw new DomainException("Email is required.");
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new DomainException("Password hash is required.");

        Id = id;
        FullName = fullName;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
        AvatarUrl = avatarUrl ?? string.Empty;
        PhoneNumber = phoneNumber ?? string.Empty;
        EmployeeId = employeeId ?? string.Empty;
        SubjectSpecialization = subjectSpecialization ?? string.Empty;
        Qualification = qualification ?? string.Empty;
        GuardianName = guardianName ?? string.Empty;
        GuardianEmail = guardianEmail ?? string.Empty;
        Address = address ?? string.Empty;
        StudentId = studentId ?? string.Empty;
        Gender = gender ?? string.Empty;
        DateOfBirth = dateOfBirth;
        AdmissionDate = admissionDate;
        JoiningDate = joiningDate;
        ParentMobile = parentMobile ?? string.Empty;
        IsActive = isActive;
    }

    public void ToggleActive()
    {
        IsActive = !IsActive;
    }

    public void UpdateProfile(string fullName, string parentMobile)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        FullName = fullName;
        ParentMobile = parentMobile ?? string.Empty;
    }

    public void ChangePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash)) throw new DomainException("Password hash is required.");
        PasswordHash = newPasswordHash;
    }
}

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
    public string ParentMobile { get; private set; }

    private AppUser() { ParentMobile = string.Empty; }

    public AppUser(Guid id, string fullName, string email, string passwordHash, UserRole role, string parentMobile = "", bool isActive = true)
    {
        if (string.IsNullOrWhiteSpace(fullName)) throw new DomainException("Full name is required.");
        if (string.IsNullOrWhiteSpace(email)) throw new DomainException("Email is required.");
        if (string.IsNullOrWhiteSpace(passwordHash)) throw new DomainException("Password hash is required.");

        Id = id;
        FullName = fullName;
        Email = email;
        PasswordHash = passwordHash;
        Role = role;
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

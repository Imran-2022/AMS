using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class NotificationPreference
{
    public Guid UserId { get; private set; }
    public NotificationType Type { get; private set; }
    public bool IsEnabled { get; private set; }

    public User User { get; private set; } = null!;

    private NotificationPreference() { }

    public NotificationPreference(Guid userId, NotificationType type, bool isEnabled)
    {
        if (userId == Guid.Empty) throw new DomainException("User is required.");
        UserId = userId;
        Type = type;
        IsEnabled = isEnabled;
    }

    public void SetEnabled(bool isEnabled)
    {
        IsEnabled = isEnabled;
    }
}

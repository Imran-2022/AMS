using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Notification
{
    public Guid Id { get; private set; }
    public Guid RecipientUserId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Message { get; private set; } = string.Empty;
    public string? RelatedEntityType { get; private set; }
    public Guid? RelatedEntityId { get; private set; }
    public bool IsRead { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public User RecipientUser { get; private set; } = null!;

    private Notification() { }

    public Notification(
        Guid id,
        Guid recipientUserId,
        NotificationType type,
        string title,
        string message,
        string? relatedEntityType = null,
        Guid? relatedEntityId = null,
        bool isRead = false,
        DateTime? createdAt = null)
    {
        if (recipientUserId == Guid.Empty) throw new DomainException("Recipient user is required.");
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (string.IsNullOrWhiteSpace(message)) throw new DomainException("Message is required.");

        Id = id;
        RecipientUserId = recipientUserId;
        Type = type;
        Title = title;
        Message = message;
        RelatedEntityType = relatedEntityType;
        RelatedEntityId = relatedEntityId;
        IsRead = isRead;
        CreatedAt = createdAt ?? DateTime.UtcNow;
    }

    public void MarkAsRead()
    {
        IsRead = true;
    }
}

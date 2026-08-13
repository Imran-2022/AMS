using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class NotificationAppService : INotificationAppService
{
    private readonly INotificationRepository _notificationRepository;
    private readonly INotificationPreferenceRepository _notificationPreferenceRepository;

    public NotificationAppService(
        INotificationRepository notificationRepository,
        INotificationPreferenceRepository notificationPreferenceRepository)
    {
        _notificationRepository = notificationRepository;
        _notificationPreferenceRepository = notificationPreferenceRepository;
    }

    public async Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;

        var notifications = await _notificationRepository.GetByUserAsync(userId, page, pageSize, cancellationToken);
        return notifications.Select(x => new NotificationDto
        {
            Id = x.Id,
            RecipientUserId = x.RecipientUserId,
            Type = x.Type.ToString(),
            Title = x.Title,
            Message = x.Message,
            RelatedEntityType = x.RelatedEntityType,
            RelatedEntityId = x.RelatedEntityId,
            IsRead = x.IsRead,
            CreatedAt = x.CreatedAt
        }).ToList();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _notificationRepository.GetUnreadCountAsync(userId, cancellationToken);

    public async Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var notification = await _notificationRepository.GetByIdAsync(notificationId, cancellationToken) ?? throw new NotFoundException("Notification not found.");
        if (notification.RecipientUserId != userId) throw new ForbiddenException("You cannot access this notification.");

        if (notification.IsRead) return true;
        notification.MarkAsRead();
        await _notificationRepository.UpdateAsync(notification, cancellationToken);
        return true;
    }

    public async Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _notificationRepository.MarkAllAsReadAsync(userId, cancellationToken);

    public async Task<IReadOnlyList<NotificationPreferenceDto>> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var results = new List<NotificationPreferenceDto>();
        foreach (NotificationType type in Enum.GetValues<NotificationType>())
        {
            var preference = await _notificationPreferenceRepository.GetAsync(userId, type, cancellationToken);
            results.Add(new NotificationPreferenceDto
            {
                Type = type.ToString(),
                IsEnabled = preference?.IsEnabled ?? true
            });
        }

        return results;
    }

    public async Task<NotificationPreferenceDto> UpdatePreferenceAsync(Guid userId, NotificationType type, bool isEnabled, CancellationToken cancellationToken = default)
    {
        var existing = await _notificationPreferenceRepository.GetAsync(userId, type, cancellationToken);
        if (existing is null)
        {
            // Create new preference if it doesn't exist
            existing = new NotificationPreference(userId, type, isEnabled);
            try
            {
                await _notificationPreferenceRepository.AddAsync(existing, cancellationToken);
            }
            catch (InvalidOperationException)
            {
                // Handle race condition: another request already created this preference
                // Re-fetch and update it instead
                existing = await _notificationPreferenceRepository.GetAsync(userId, type, cancellationToken) 
                    ?? throw new InvalidOperationException("Failed to create or retrieve notification preference.");
                existing.SetEnabled(isEnabled);
                await _notificationPreferenceRepository.UpdateAsync(existing, cancellationToken);
            }
        }
        else
        {
            // Update existing preference
            existing.SetEnabled(isEnabled);
            await _notificationPreferenceRepository.UpdateAsync(existing, cancellationToken);
        }

        return new NotificationPreferenceDto { Type = type.ToString(), IsEnabled = existing.IsEnabled };
    }
}

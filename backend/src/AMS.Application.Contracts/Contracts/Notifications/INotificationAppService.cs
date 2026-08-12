using AMS.Application.Contracts.Dtos;
using AMS.Domain.Shared;

namespace AMS.Application.Contracts;

public interface INotificationAppService
{
    Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(Guid userId, int page, int pageSize, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<bool> MarkAsReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task MarkAllAsReadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationPreferenceDto>> GetPreferencesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<NotificationPreferenceDto> UpdatePreferenceAsync(Guid userId, NotificationType type, bool isEnabled, CancellationToken cancellationToken = default);
}

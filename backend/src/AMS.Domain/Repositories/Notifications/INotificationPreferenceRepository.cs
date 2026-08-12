using AMS.Domain.Entities;
using AMS.Domain.Shared;

namespace AMS.Domain.Repositories;

public interface INotificationPreferenceRepository
{
    Task<NotificationPreference?> GetAsync(Guid userId, NotificationType type, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<NotificationPreference>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task AddAsync(NotificationPreference preference, CancellationToken cancellationToken = default);
    Task UpdateAsync(NotificationPreference preference, CancellationToken cancellationToken = default);
}

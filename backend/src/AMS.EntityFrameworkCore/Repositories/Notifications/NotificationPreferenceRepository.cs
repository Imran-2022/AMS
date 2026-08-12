using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class NotificationPreferenceRepository : INotificationPreferenceRepository
{
    private readonly AmsDbContext _dbContext;

    public NotificationPreferenceRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<NotificationPreference?> GetAsync(Guid userId, NotificationType type, CancellationToken cancellationToken = default)
        => await _dbContext.NotificationPreferences.FirstOrDefaultAsync(x => x.UserId == userId && x.Type == type, cancellationToken);

    public async Task<IReadOnlyList<NotificationPreference>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default)
        => await _dbContext.NotificationPreferences.Where(x => x.UserId == userId).ToListAsync(cancellationToken);

    public async Task AddAsync(NotificationPreference preference, CancellationToken cancellationToken = default)
    {
        await _dbContext.NotificationPreferences.AddAsync(preference, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(NotificationPreference preference, CancellationToken cancellationToken = default)
    {
        _dbContext.NotificationPreferences.Update(preference);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}

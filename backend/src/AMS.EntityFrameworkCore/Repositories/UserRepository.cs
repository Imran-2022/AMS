using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AmsDbContext _dbContext;

    public UserRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<AppUser?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.AppUsers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<AppUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _dbContext.AppUsers.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

    public async Task<IReadOnlyList<AppUser>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.AppUsers.ToListAsync(cancellationToken);

    public async Task AddAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        await _dbContext.AppUsers.AddAsync(user, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        _dbContext.AppUsers.Update(user);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.AppUsers.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.AppUsers.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

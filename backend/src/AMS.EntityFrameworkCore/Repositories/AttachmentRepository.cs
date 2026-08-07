using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class AttachmentRepository : IAttachmentRepository
{
    private readonly AmsDbContext _dbContext;

    public AttachmentRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Attachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.Set<Attachment>().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Attachment>> GetByOwnerAsync(string ownerType, Guid ownerId, CancellationToken cancellationToken = default)
        => await _dbContext.Set<Attachment>().Where(a => a.OwnerType == ownerType && a.OwnerId == ownerId).ToListAsync(cancellationToken);

    public async Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<Attachment>().AddAsync(attachment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Set<Attachment>().FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.Set<Attachment>().Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

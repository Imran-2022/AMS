using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using System.Linq;

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

    public async Task<Attachment?> GetByStoredFileNameAsync(string storedFileName, CancellationToken cancellationToken = default)
        => await _dbContext.Set<Attachment>().FirstOrDefaultAsync(x => x.StoredFileName == storedFileName, cancellationToken);

    public async Task<IReadOnlyList<Attachment>> GetByOwnerAsync(string ownerType, Guid ownerId, CancellationToken cancellationToken = default)
        => await _dbContext.Set<Attachment>().Where(a => a.OwnerType == ownerType && a.OwnerId == ownerId).ToListAsync(cancellationToken);

    public async Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default)
    {
        await _dbContext.Set<Attachment>().AddAsync(attachment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Attachment attachment, CancellationToken cancellationToken = default)
    {
        var set = _dbContext.Set<Attachment>();
        if (!set.Local.Any(a => a.Id == attachment.Id))
        {
            set.Attach(attachment);
        }
        _dbContext.Entry(attachment).State = EntityState.Modified;
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

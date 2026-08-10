using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IAttachmentRepository
{
    Task<Attachment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Attachment?> GetByStoredFileNameAsync(string storedFileName, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Attachment>> GetByOwnerAsync(string ownerType, Guid ownerId, CancellationToken cancellationToken = default);
    Task AddAsync(Attachment attachment, CancellationToken cancellationToken = default);
    Task UpdateAsync(Attachment attachment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

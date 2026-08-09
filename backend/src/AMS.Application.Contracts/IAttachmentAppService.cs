using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IAttachmentAppService
{
    Task<AttachmentDto> AddAsync(string ownerType, Guid ownerId, Stream fileStream, string fileName, string contentType, Guid uploadedBy);
    Task<IReadOnlyList<AttachmentDto>> ListAsync(string ownerType, Guid ownerId);
    Task<AttachmentDto> RenameAsync(Guid id, string newOriginalFileName);
    Task DeleteAsync(Guid id);
    Task DeleteByOwnerAsync(string ownerType, Guid ownerId);
    Task<Stream?> OpenStreamAsync(string storedFileName);
}

using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;

namespace AMS.Application.Services;

public class AttachmentAppService : IAttachmentAppService
{
    private readonly IAttachmentRepository _attachmentRepository;
    private readonly IFileAppService _fileAppService;

    public AttachmentAppService(IAttachmentRepository attachmentRepository, IFileAppService fileAppService)
    {
        _attachmentRepository = attachmentRepository;
        _fileAppService = fileAppService;
    }

    public async Task<AttachmentDto> AddAsync(string ownerType, Guid ownerId, Stream fileStream, string fileName, string contentType, Guid uploadedBy)
    {
        var result = await _fileAppService.SaveFileAsync(fileStream, fileName, contentType);

        // storedFileName is the last segment of FileUrl (we use /api/files/download/{storedFileName})
        var storedSegment = result.FileUrl?.Split('/').Last() ?? Guid.NewGuid().ToString();

        var attachment = new Attachment(Guid.NewGuid(), ownerType, ownerId, fileName, storedSegment, contentType, result.SizeBytes, uploadedBy, DateTime.UtcNow);
        await _attachmentRepository.AddAsync(attachment);

        return new AttachmentDto
        {
            Id = attachment.Id,
            OwnerType = attachment.OwnerType,
            OwnerId = attachment.OwnerId,
            OriginalFileName = attachment.OriginalFileName,
            StoredFileName = attachment.StoredFileName,
            ContentType = attachment.ContentType,
            SizeBytes = attachment.SizeBytes,
            UploadedByUserId = attachment.UploadedByUserId,
            UploadedAt = attachment.UploadedAt,
            DownloadUrl = $"/api/files/download/{attachment.StoredFileName}"
        };
    }

    public async Task<IReadOnlyList<AttachmentDto>> ListAsync(string ownerType, Guid ownerId)
    {
        var list = await _attachmentRepository.GetByOwnerAsync(ownerType, ownerId);
        return list.Select(a => new AttachmentDto
        {
            Id = a.Id,
            OwnerType = a.OwnerType,
            OwnerId = a.OwnerId,
            OriginalFileName = a.OriginalFileName,
            StoredFileName = a.StoredFileName,
            ContentType = a.ContentType,
            SizeBytes = a.SizeBytes,
            UploadedByUserId = a.UploadedByUserId,
            UploadedAt = a.UploadedAt,
            DownloadUrl = $"/api/files/download/{a.StoredFileName}"
        }).ToList();
    }

    public async Task DeleteAsync(Guid id)
    {
        var entity = await _attachmentRepository.GetByIdAsync(id);
        if (entity is null) return;

        // Delete physical file if exists
        var fileTuple = await _fileAppService.OpenFileAsync(entity.StoredFileName);
        if (fileTuple != null)
        {
            // Close the stream and attempt deletion of the underlying file path
            fileTuple.Value.Stream.Dispose();
            var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads", entity.StoredFileName);
            if (File.Exists(filePath)) File.Delete(filePath);
        }

        await _attachmentRepository.DeleteAsync(id);
    }

    public async Task<Stream?> OpenStreamAsync(string storedFileName)
    {
        var file = await _fileAppService.OpenFileAsync(storedFileName);
        return file?.Stream;
    }
}

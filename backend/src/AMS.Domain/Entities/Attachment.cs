using System;

namespace AMS.Domain.Entities;

public class Attachment
{
    public Guid Id { get; private set; }
    public string OwnerType { get; private set; } = null!; // e.g., "Assignment" or "Submission"
    public Guid OwnerId { get; private set; }
    public string OriginalFileName { get; private set; } = null!;
    public string StoredFileName { get; private set; } = null!;
    public string ContentType { get; private set; } = null!;
    public long SizeBytes { get; private set; }
    public Guid UploadedByUserId { get; private set; }
    public DateTime UploadedAt { get; private set; }

    private Attachment() { }

    public Attachment(Guid id, string ownerType, Guid ownerId, string originalFileName, string storedFileName, string contentType, long sizeBytes, Guid uploadedByUserId, DateTime uploadedAt)
    {
        Id = id;
        OwnerType = ownerType;
        OwnerId = ownerId;
        OriginalFileName = originalFileName;
        StoredFileName = storedFileName;
        ContentType = contentType;
        SizeBytes = sizeBytes;
        UploadedByUserId = uploadedByUserId;
        UploadedAt = uploadedAt;
    }
}

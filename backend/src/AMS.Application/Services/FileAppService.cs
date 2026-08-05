using AMS.Application.Contracts;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class FileAppService : IFileAppService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".docx", ".doc", ".txt", ".zip", ".png", ".jpg", ".jpeg"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    private readonly string _uploadDirectory;

    public FileAppService()
    {
        _uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(_uploadDirectory))
        {
            Directory.CreateDirectory(_uploadDirectory);
        }
    }

    public async Task<FileUploadResultDto> SaveFileAsync(Stream fileStream, string fileName, string contentType)
    {
        if (fileStream == null || fileStream.Length == 0)
        {
            throw new DomainException("File is empty.");
        }

        if (fileStream.Length > MaxFileSizeBytes)
        {
            throw new DomainException("File size exceeds maximum allowed limit of 10MB.");
        }

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
        {
            throw new DomainException($"File extension '{extension}' is not allowed. Allowed formats: {string.Join(", ", AllowedExtensions)}");
        }

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var filePath = Path.Combine(_uploadDirectory, uniqueFileName);

        using (var destinationStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destinationStream);
        }

        return new FileUploadResultDto
        {
            FileName = fileName,
            FileUrl = $"/uploads/{uniqueFileName}",
            SizeBytes = fileStream.Length
        };
    }
}

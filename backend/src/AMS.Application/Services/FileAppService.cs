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
        // Store uploads outside of wwwroot so files are not directly served by static file middleware.
        // Use App_Data/Uploads under the application root.
        _uploadDirectory = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads");
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

        // Return an API download URL rather than a public static path.
        return new FileUploadResultDto
        {
            FileName = fileName,
            FileUrl = $"/api/files/download/{uniqueFileName}",
            SizeBytes = fileStream.Length
        };
    }

    public async Task<(Stream Stream, string OriginalFileName)?> OpenFileAsync(string storedFileName)
    {
        if (string.IsNullOrEmpty(storedFileName)) return null;
        var filePath = Path.Combine(_uploadDirectory, storedFileName);
        if (!File.Exists(filePath)) return null;

        // Derive original file name from stored file name format: {guid}_{originalName}
        var idx = storedFileName.IndexOf('_');
        var original = idx >= 0 && idx < storedFileName.Length - 1 ? storedFileName[(idx + 1)..] : storedFileName;
        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return (stream, original);
    }

    public async Task<bool> DeleteFileAsync(string storedFileName)
    {
        if (string.IsNullOrEmpty(storedFileName)) return false;
        var filePath = Path.Combine(_uploadDirectory, storedFileName);
        if (!File.Exists(filePath)) return false;

        try
        {
            File.Delete(filePath);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

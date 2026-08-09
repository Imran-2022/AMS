using AMS.Application.Contracts;
using Microsoft.Extensions.Configuration;

namespace AMS.Infrastructure.Files;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _basePath;
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".docx", ".doc", ".txt", ".zip", ".png", ".jpg", ".jpeg"
    };

    private const long MaxFileSizeBytes = 10 * 1024 * 1024;

    public LocalFileStorageService(IConfiguration configuration)
    {
        var uploadsRoot = configuration["FileStorage:Local:UploadsPath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads");
        _basePath = Path.GetFullPath(uploadsRoot);
        Directory.CreateDirectory(_basePath);
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType)
    {
        if (fileStream == null || fileStream.Length == 0)
            throw new InvalidOperationException("File is empty.");

        if (fileStream.Length > MaxFileSizeBytes)
            throw new InvalidOperationException("File size exceeds maximum allowed limit of 10MB.");

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrEmpty(extension) || !AllowedExtensions.Contains(extension))
            throw new InvalidOperationException($"File extension '{extension}' is not allowed.");

        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
        var filePath = Path.Combine(_basePath, uniqueFileName);

        await using var destinationStream = new FileStream(filePath, FileMode.Create, FileAccess.Write, FileShare.None);
        await fileStream.CopyToAsync(destinationStream);

        return uniqueFileName;
    }

    public Task<Stream?> OpenFileAsync(string storedFileName)
    {
        if (string.IsNullOrWhiteSpace(storedFileName))
            return Task.FromResult<Stream?>(null);

        var filePath = Path.Combine(_basePath, Path.GetFileName(storedFileName));
        if (!File.Exists(filePath))
            return Task.FromResult<Stream?>(null);

        var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        return Task.FromResult<Stream?>(stream);
    }

    public Task<bool> DeleteFileAsync(string storedFileName)
    {
        if (string.IsNullOrWhiteSpace(storedFileName))
            return Task.FromResult(false);

        var filePath = Path.Combine(_basePath, Path.GetFileName(storedFileName));
        if (!File.Exists(filePath))
            return Task.FromResult(false);

        File.Delete(filePath);
        return Task.FromResult(true);
    }
}

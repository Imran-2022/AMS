using AMS.Application.Contracts;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class FileAppService : IFileAppService
{
    private readonly IFileStorageService _fileStorageService;
    private const long MaxFileSizeBytes = 10 * 1024 * 1024; // 10MB

    public FileAppService(IFileStorageService fileStorageService)
    {
        _fileStorageService = fileStorageService;
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

        var storedFileName = await _fileStorageService.SaveFileAsync(fileStream, fileName, contentType);

        return new FileUploadResultDto
        {
            FileName = fileName,
            FileUrl = $"/uploads/{storedFileName}",
            SizeBytes = fileStream.Length
        };
    }

    public async Task<(Stream Stream, string OriginalFileName)?> OpenFileAsync(string storedFileName)
    {
        if (string.IsNullOrWhiteSpace(storedFileName))
            return null;

        var stream = await _fileStorageService.OpenFileAsync(storedFileName);
        if (stream == null)
            return null;

        var originalFileName = DeriveOriginalFileName(storedFileName);
        return (stream, originalFileName);
    }

    public Task<bool> DeleteFileAsync(string storedFileName)
    {
        return _fileStorageService.DeleteFileAsync(storedFileName);
    }

    private static string DeriveOriginalFileName(string storedFileName)
    {
        var idx = storedFileName.IndexOf('_');
        return idx >= 0 && idx < storedFileName.Length - 1 ? storedFileName[(idx + 1)..] : storedFileName;
    }
}

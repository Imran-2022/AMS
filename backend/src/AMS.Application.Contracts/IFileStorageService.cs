namespace AMS.Application.Contracts;

public interface IFileStorageService
{
    Task<string> SaveFileAsync(Stream fileStream, string fileName, string contentType);
    Task<Stream?> OpenFileAsync(string storedFileName);
    Task<bool> DeleteFileAsync(string storedFileName);
}

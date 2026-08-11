namespace AMS.Application.Contracts;

public class FileUploadResultDto
{
    public string FileUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
}

public interface IFileAppService
{
    Task<FileUploadResultDto> SaveFileAsync(Stream fileStream, string fileName, string contentType);
    /// <summary>
    /// Open a stored file by its stored file name (the unique name returned in FileUrl). Returns a tuple of Stream and original file name, or null if not found.
    /// </summary>
    Task<(Stream Stream, string OriginalFileName)?> OpenFileAsync(string storedFileName);
    /// <summary>
    /// Delete a stored file by its stored file name. Returns true if the file was deleted.
    /// </summary>
    Task<bool> DeleteFileAsync(string storedFileName);
}

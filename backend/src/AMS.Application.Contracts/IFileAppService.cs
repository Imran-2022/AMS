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
}

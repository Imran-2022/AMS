using AMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileAppService _fileAppService;

    public FilesController(IFileAppService fileAppService)
    {
        _fileAppService = fileAppService;
    }

    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileUploadResultDto>> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        using var stream = file.OpenReadStream();
        var result = await _fileAppService.SaveFileAsync(stream, file.FileName, file.ContentType);
        return Ok(result);
    }

    [HttpGet("download/{storedFileName}")]
    public async Task<IActionResult> Download(string storedFileName)
    {
        if (string.IsNullOrEmpty(storedFileName)) return BadRequest();

        var result = await _fileAppService.OpenFileAsync(storedFileName);
        if (result == null) return NotFound();

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads", storedFileName);
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(filePath, out var contentType)) contentType = "application/octet-stream";

        // Reset stream position if possible
        if (result.Value.Stream.CanSeek) result.Value.Stream.Position = 0;

        return File(result.Value.Stream, contentType, result.Value.OriginalFileName);
    }
}

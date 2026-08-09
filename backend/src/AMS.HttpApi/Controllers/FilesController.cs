using AMS.Application.Contracts;
using AMS.Application.Contracts.Authorization;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using System.Security.Claims;
using AMS.Application;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly IFileAppService _fileAppService;
    private readonly IAttachmentRepository _attachmentRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;
    private readonly ILogger<FilesController> _logger;
    public FilesController(IFileAppService fileAppService,
        IAttachmentRepository attachmentRepository,
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        ILogger<FilesController> logger)
    {
        _fileAppService = fileAppService;
        _attachmentRepository = attachmentRepository;
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _logger = logger;
    }

    [HttpPost("upload")]
    [AllowAnonymous]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<FileUploadResultDto>> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        // Debug logging to help diagnose 403 issues from frontend
        try
        {
            var authHeader = Request.Headers.ContainsKey("Authorization") ? Request.Headers["Authorization"].ToString() : null;
            _logger.LogInformation("Upload called. Auth header present: {HasAuth}", authHeader != null);
            _logger.LogInformation("User is authenticated: {IsAuthenticated}", User?.Identity?.IsAuthenticated ?? false);
            if (User?.Identity?.IsAuthenticated ?? false)
            {
                foreach (var claim in User.Claims)
                {
                    _logger.LogInformation("Claim: {Type}={Value}", claim.Type, claim.Value);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error while logging upload auth info");
        }

        using var stream = file.OpenReadStream();
        var result = await _fileAppService.SaveFileAsync(stream, file.FileName, file.ContentType);
        return Ok(result);
    }

    [HttpGet("download/{storedFileName}")]
    public async Task<IActionResult> Download(string storedFileName)
    {
        if (string.IsNullOrEmpty(storedFileName)) return BadRequest();

        // sanitize filename to avoid path traversal
        storedFileName = Path.GetFileName(storedFileName);

        var attachment = await _attachmentRepository.GetByStoredFileNameAsync(storedFileName);
        if (attachment == null) return NotFound();

        // authorize access to the attachment resource via centralized handler
        var auth = await HttpContext.RequestServices.GetRequiredService<IAuthorizationService>()
            .AuthorizeAsync(User, storedFileName, new AttachmentAccessRequirement());
        if (!auth.Succeeded) return Forbid();

        var result = await _fileAppService.OpenFileAsync(storedFileName);
        if (result == null) return NotFound();

        var filePath = Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "Uploads", storedFileName);
        var provider = new FileExtensionContentTypeProvider();
        if (!provider.TryGetContentType(filePath, out var contentType)) contentType = "application/octet-stream";

        if (result.Value.Stream.CanSeek) result.Value.Stream.Position = 0;

        return File(result.Value.Stream, contentType);
    }
}

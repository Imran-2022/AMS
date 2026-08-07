using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttachmentsController : ControllerBase
{
    private readonly IAttachmentAppService _attachmentAppService;

    public AttachmentsController(IAttachmentAppService attachmentAppService)
    {
        _attachmentAppService = attachmentAppService;
    }

    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<AttachmentDto>> Upload([FromForm] string ownerType, [FromForm] Guid ownerId, IFormFile file)
    {
        if (file == null || file.Length == 0) return BadRequest("No file uploaded.");

        using var stream = file.OpenReadStream();
        var userId = Guid.Empty;
        var result = await _attachmentAppService.AddAsync(ownerType, ownerId, stream, file.FileName, file.ContentType ?? "application/octet-stream", userId);
        return Ok(result);
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AttachmentDto>>> List([FromQuery] string ownerType, [FromQuery] Guid ownerId)
    {
        var list = await _attachmentAppService.ListAsync(ownerType, ownerId);
        return Ok(list);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _attachmentAppService.DeleteAsync(id);
        return NoContent();
    }
}

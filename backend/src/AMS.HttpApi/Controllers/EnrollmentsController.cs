using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/enrollments")]
[Authorize]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentAppService _enrollmentAppService;

    public EnrollmentsController(IEnrollmentAppService enrollmentAppService)
    {
        _enrollmentAppService = enrollmentAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StudentEnrollmentDto>>> GetAll()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        var items = await _enrollmentAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<StudentEnrollmentDto>> Create([FromBody] CreateStudentEnrollmentDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        var item = await _enrollmentAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpDelete]
    public async Task<ActionResult> Delete([FromQuery] Guid studentId, [FromQuery] Guid classCourseId)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        await _enrollmentAppService.DeleteAsync(studentId, classCourseId, currentUserId, currentUserRole);
        return NoContent();
    }
}

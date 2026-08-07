using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/teacher-assignments")]
[Authorize]
public class TeacherAssignmentsController : ControllerBase
{
    private readonly ITeacherSubjectAssignmentAppService _appService;

    public TeacherAssignmentsController(ITeacherSubjectAssignmentAppService appService)
    {
        _appService = appService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TeacherSubjectAssignmentDto>>> GetAll()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        var items = await _appService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TeacherSubjectAssignmentDto>> Create([FromBody] CreateTeacherSubjectAssignmentDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        var item = await _appService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpDelete]
    public async Task<ActionResult> Delete([FromQuery] Guid teacherId, [FromQuery] Guid subjectId)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? string.Empty;
        await _appService.DeleteAsync(teacherId, subjectId, currentUserId, currentUserRole);
        return NoContent();
    }
}

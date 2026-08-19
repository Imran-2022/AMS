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
    private readonly ICurrentUserService _currentUser;

    public TeacherAssignmentsController(ITeacherSubjectAssignmentAppService appService, ICurrentUserService currentUser)
    {
        _appService = appService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TeacherSubjectAssignmentDto>>> GetAll([FromQuery] bool includeAllAcademicYears = false)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var items = await _appService.GetAllAsync(currentUserId, currentUserRole, includeAllAcademicYears);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<TeacherSubjectAssignmentDto>> Create([FromBody] CreateTeacherSubjectAssignmentDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var item = await _appService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpDelete]
    public async Task<ActionResult> Delete([FromQuery] Guid teacherId, [FromQuery] Guid subjectId)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _appService.DeleteAsync(teacherId, subjectId, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPost("reassign")]
    public async Task<ActionResult<TeacherSubjectAssignmentDto>> ReassignTeacher([FromBody] ReassignTeacherDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var item = await _appService.ReassignTeacherAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpPost("bulk-reassign")]
    public async Task<ActionResult<IReadOnlyList<TeacherSubjectAssignmentDto>>> BulkReassignTeachers([FromBody] BulkReassignTeachersDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var items = await _appService.BulkReassignTeachersAsync(input, currentUserId, currentUserRole);
        return Ok(items);
    }
}

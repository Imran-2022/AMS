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
    private readonly ICurrentUserService _currentUser;

    public EnrollmentsController(IEnrollmentAppService enrollmentAppService, ICurrentUserService currentUser)
    {
        _enrollmentAppService = enrollmentAppService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StudentEnrollmentDto>>> GetAll([FromQuery] bool includeAllYears = false)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var items = await _enrollmentAppService.GetAllAsync(currentUserId, currentUserRole, includeAllYears);
        return Ok(items);
    }

    [HttpPost]
    public async Task<ActionResult<StudentEnrollmentDto>> Create([FromBody] CreateStudentEnrollmentDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var item = await _enrollmentAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpDelete]
    public async Task<ActionResult> Delete([FromQuery] Guid studentId, [FromQuery] Guid classCourseId)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _enrollmentAppService.DeleteAsync(studentId, classCourseId, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPost("promote")]
    public async Task<ActionResult<StudentEnrollmentDto>> PromoteStudent([FromBody] PromoteStudentDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var item = await _enrollmentAppService.PromoteStudentAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetAll), item);
    }

    [HttpPost("bulk-promote")]
    public async Task<ActionResult<IReadOnlyList<StudentEnrollmentDto>>> BulkPromoteStudents([FromBody] BulkPromoteStudentsDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var items = await _enrollmentAppService.BulkPromoteStudentsAsync(input, currentUserId, currentUserRole);
        return Ok(items);
    }
}

using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;
using Microsoft.Extensions.Logging;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentAppService _assignmentAppService;
    private readonly Microsoft.Extensions.Logging.ILogger<AssignmentsController> _logger;
    private readonly ICurrentUserService _currentUser;

    public AssignmentsController(IAssignmentAppService assignmentAppService, Microsoft.Extensions.Logging.ILogger<AssignmentsController> logger, ICurrentUserService currentUser)
    {
        _assignmentAppService = assignmentAppService;
        _logger = logger;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AssignmentDto>>> GetAll([FromQuery] bool includeAllAcademicYears = false)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignments = await _assignmentAppService.GetAllAsync(currentUserId, currentUserRole, includeAllAcademicYears);
        return Ok(assignments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssignmentDto>> GetById(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignment = await _assignmentAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return assignment is null ? NotFound() : Ok(assignment);
    }

    [HttpPost]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        if (input is null)
        {
            _logger.LogWarning("Create assignment request missing body for user {UserId}", currentUserId);
            return BadRequest("Assignment data is required.");
        }

        _logger.LogInformation("Create assignment request by user {UserId} role {Role} input class {ClassCourseId} subject {SubjectId}", currentUserId, currentUserRole, input.ClassCourseId, input.SubjectId);
        try
        {
            var assignment = await _assignmentAppService.CreateAsync(input, currentUserId, currentUserRole);
            return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create assignment for user {UserId}", currentUserId);
            throw;
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<AssignmentDto>> Update(Guid id, [FromBody] UpdateAssignmentDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignment = await _assignmentAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(assignment);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _assignmentAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPost("{id:guid}/duplicate")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<AssignmentDto>> Duplicate(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignment = await _assignmentAppService.DuplicateAsync(id, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
    }

    [HttpPatch("{id:guid}/publish")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<AssignmentDto>> Publish(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignment = await _assignmentAppService.PublishAsync(id, currentUserId, currentUserRole);
        return Ok(assignment);
    }

    [HttpPatch("{id:guid}/unpublish")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<AssignmentDto>> Unpublish(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var assignment = await _assignmentAppService.UnpublishAsync(id, currentUserId, currentUserRole);
        return Ok(assignment);
    }
}

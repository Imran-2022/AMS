using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/assignments")]
[Authorize]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentAppService _assignmentAppService;

    public AssignmentsController(IAssignmentAppService assignmentAppService)
    {
        _assignmentAppService = assignmentAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AssignmentDto>>> GetAll()
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var assignments = await _assignmentAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(assignments);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssignmentDto>> GetById(Guid id)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var assignment = await _assignmentAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return assignment is null ? NotFound() : Ok(assignment);
    }

    [HttpPost]
    public async Task<ActionResult<AssignmentDto>> Create([FromBody] CreateAssignmentDto input)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var assignment = await _assignmentAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = assignment.Id }, assignment);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<AssignmentDto>> Update(Guid id, [FromBody] UpdateAssignmentDto input)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var assignment = await _assignmentAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(assignment);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        await _assignmentAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPatch("{id:guid}/publish")]
    public async Task<ActionResult<AssignmentDto>> Publish(Guid id)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var assignment = await _assignmentAppService.PublishAsync(id, currentUserId, currentUserRole);
        return Ok(assignment);
    }
}

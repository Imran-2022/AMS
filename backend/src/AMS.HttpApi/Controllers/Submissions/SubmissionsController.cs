using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;
using Microsoft.Extensions.DependencyInjection;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/submissions")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionAppService _submissionAppService;
    private readonly ICurrentUserService _currentUser;

    public SubmissionsController(ISubmissionAppService submissionAppService, ICurrentUserService currentUser)
    {
        _submissionAppService = submissionAppService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubmissionDto>>> GetAll([FromQuery] bool includeAllAcademicYears = false)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submissions = await _submissionAppService.GetAllAsync(currentUserId, currentUserRole, includeAllAcademicYears);
        return Ok(submissions);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<SubmissionDto>>> GetMine()
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submissions = await _submissionAppService.GetMineAsync(currentUserId, currentUserRole);
        return Ok(submissions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubmissionDto>> GetById(Guid id)
    {
        // Authorization moved into application service; rely on service to enforce access

        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submission = await _submissionAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return submission is null ? NotFound() : Ok(submission);
    }

    [HttpPost]
    [Authorize(Policy = "StudentsOnly")]
    public async Task<ActionResult<SubmissionDto>> Create([FromBody] CreateSubmissionDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submission = await _submissionAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "StudentsOnly")]
    public async Task<ActionResult<SubmissionDto>> Update(Guid id, [FromBody] UpdateSubmissionDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submission = await _submissionAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "StudentsOnly")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _submissionAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPatch("{id:guid}/grade")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<SubmissionDto>> Grade(Guid id, [FromBody] GradeSubmissionDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submission = await _submissionAppService.GradeAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }

    [HttpPatch("{id:guid}/status")]
    [Authorize(Policy = "TeachersOrAdmins")]
    public async Task<ActionResult<SubmissionDto>> UpdateStatus(Guid id, [FromBody] UpdateSubmissionStatusDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var submission = await _submissionAppService.UpdateStatusAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }
}

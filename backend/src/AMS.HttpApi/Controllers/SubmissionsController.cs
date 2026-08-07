using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/submissions")]
[Authorize]
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionAppService _submissionAppService;

    public SubmissionsController(ISubmissionAppService submissionAppService)
    {
        _submissionAppService = submissionAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubmissionDto>>> GetAll()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submissions = await _submissionAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(submissions);
    }

    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<SubmissionDto>>> GetMine()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submissions = await _submissionAppService.GetMineAsync(currentUserId, currentUserRole);
        return Ok(submissions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubmissionDto>> GetById(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submission = await _submissionAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return submission is null ? NotFound() : Ok(submission);
    }

    [HttpPost]
    public async Task<ActionResult<SubmissionDto>> Create([FromBody] CreateSubmissionDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submission = await _submissionAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = submission.Id }, submission);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SubmissionDto>> Update(Guid id, [FromBody] UpdateSubmissionDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submission = await _submissionAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        await _submissionAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }

    [HttpPatch("{id:guid}/grade")]
    public async Task<ActionResult<SubmissionDto>> Grade(Guid id, [FromBody] GradeSubmissionDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submission = await _submissionAppService.GradeAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<SubmissionDto>> UpdateStatus(Guid id, [FromBody] UpdateSubmissionStatusDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var submission = await _submissionAppService.UpdateStatusAsync(id, input, currentUserId, currentUserRole);
        return Ok(submission);
    }
}

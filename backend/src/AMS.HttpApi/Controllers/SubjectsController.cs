using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/subjects")]
[Authorize]
public class SubjectsController : ControllerBase
{
    private readonly ISubjectAppService _subjectAppService;

    public SubjectsController(ISubjectAppService subjectAppService)
    {
        _subjectAppService = subjectAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SubjectDto>>> GetAll()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var subjects = await _subjectAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(subjects);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubjectDto>> GetById(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var subject = await _subjectAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return subject is null ? NotFound() : Ok(subject);
    }

    [HttpPost]
    public async Task<ActionResult<SubjectDto>> Create([FromBody] CreateSubjectDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var subject = await _subjectAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = subject.Id }, subject);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SubjectDto>> Update(Guid id, [FromBody] UpdateSubjectDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var subject = await _subjectAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(subject);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        await _subjectAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }
}

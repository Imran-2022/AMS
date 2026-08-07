using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassCourseAppService _classCourseAppService;

    public ClassesController(IClassCourseAppService classCourseAppService)
    {
        _classCourseAppService = classCourseAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClassCourseDto>>> GetAll()
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var classes = await _classCourseAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(classes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClassCourseDto>> GetById(Guid id)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var classCourse = await _classCourseAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return classCourse is null ? NotFound() : Ok(classCourse);
    }

    [HttpPost]
    public async Task<ActionResult<ClassCourseDto>> Create([FromBody] CreateClassCourseDto input)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var classCourse = await _classCourseAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = classCourse.Id }, classCourse);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClassCourseDto>> Update(Guid id, [FromBody] UpdateClassCourseDto input)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var classCourse = await _classCourseAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(classCourse);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = Guid.Parse(User.Identity?.Name ?? Guid.Empty.ToString());
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        await _classCourseAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }
}

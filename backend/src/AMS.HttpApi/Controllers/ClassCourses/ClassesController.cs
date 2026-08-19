using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassCourseAppService _classCourseAppService;
    private readonly ICurrentUserService _currentUser;

    public ClassesController(IClassCourseAppService classCourseAppService, ICurrentUserService currentUser)
    {
        _classCourseAppService = classCourseAppService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClassCourseDto>>> GetAll([FromQuery] bool includeAllYears = false)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var classes = await _classCourseAppService.GetAllAsync(currentUserId, currentUserRole, includeAllYears);
        return Ok(classes);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClassCourseDto>> GetById(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var classCourse = await _classCourseAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return classCourse is null ? NotFound() : Ok(classCourse);
    }

    [HttpPost]
    public async Task<ActionResult<ClassCourseDto>> Create([FromBody] CreateClassCourseDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var classCourse = await _classCourseAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = classCourse.Id }, classCourse);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ClassCourseDto>> Update(Guid id, [FromBody] UpdateClassCourseDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var classCourse = await _classCourseAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(classCourse);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _classCourseAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }
}

using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AMS.HttpApi.Extensions;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserAppService _userAppService;

    public UsersController(IUserAppService userAppService)
    {
        _userAppService = userAppService;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll()
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : User.IsInRole("Teacher") ? "Teacher" : "Student";
        var users = await _userAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";
        var user = await _userAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";
        var user = await _userAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto input)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";
        var user = await _userAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(user);
    }

    [HttpPatch("{id:guid}/toggle-status")]
    public async Task<ActionResult<UserDto>> ToggleStatus(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";
        var user = await _userAppService.ToggleActiveAsync(id, currentUserId, currentUserRole);
        return Ok(user);
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = this.GetCurrentUserId();
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";
        await _userAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }
}

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
    private readonly ICurrentUserService _currentUser;

    public UsersController(IUserAppService userAppService, ICurrentUserService currentUser)
    {
        _userAppService = userAppService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> GetAll()
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var users = await _userAppService.GetAllAsync(currentUserId, currentUserRole);
        return Ok(users);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDto>> GetById(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var user = await _userAppService.GetByIdAsync(id, currentUserId, currentUserRole);
        return user is null ? NotFound() : Ok(user);
    }

    [HttpPost]
    [Authorize(Policy = "AdminsOnly")]
    public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var user = await _userAppService.CreateAsync(input, currentUserId, currentUserRole);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UserDto>> Update(Guid id, [FromBody] UpdateUserDto input)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;

        if (currentUserRole != "Admin" && id != currentUserId)
        {
            return Forbid();
        }

        var user = await _userAppService.UpdateAsync(id, input, currentUserId, currentUserRole);
        return Ok(user);
    }

    [HttpPatch("{id:guid}/toggle-status")]
    [Authorize(Policy = "AdminsOnly")]
    public async Task<ActionResult<UserDto>> ToggleStatus(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        var user = await _userAppService.ToggleActiveAsync(id, currentUserId, currentUserRole);
        return Ok(user);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = "AdminsOnly")]
    public async Task<ActionResult> Delete(Guid id)
    {
        var currentUserId = _currentUser.UserId;
        var currentUserRole = _currentUser.Role;
        await _userAppService.DeleteAsync(id, currentUserId, currentUserRole);
        return NoContent();
    }
}

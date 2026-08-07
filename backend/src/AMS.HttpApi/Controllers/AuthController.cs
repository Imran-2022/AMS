using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthAppService _authAppService;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthAppService authAppService, IConfiguration configuration)
    {
        _authAppService = authAppService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequest request)
    {
        var user = await _authAppService.LoginAsync(request.Email, request.Password);
        if (user is null) return Unauthorized();

        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var accessTokenExpiresMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpiresMinutes"], out var accessMinutes) ? accessMinutes : 15;
        var refreshTokenExpiresMinutes = int.TryParse(_configuration["Jwt:RefreshTokenExpiresMinutes"], out var refreshMinutes) ? refreshMinutes : 21600;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("fullName", user.FullName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? string.Empty));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var accessToken = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(accessTokenExpiresMinutes),
            signingCredentials: credentials);

        var refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

        return Ok(new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(accessToken),
            RefreshToken = refreshToken,
            User = user
        });
    }

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponseDto>> Refresh([FromBody] RefreshTokenRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.RefreshToken))
            return Unauthorized();

        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var accessTokenExpiresMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpiresMinutes"], out var accessMinutes) ? accessMinutes : 15;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, "refresh-user"),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "User")
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? string.Empty));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var accessToken = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(accessTokenExpiresMinutes),
            signingCredentials: credentials);

        return Ok(new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(accessToken),
            RefreshToken = request.RefreshToken,
            User = new UserDto { Id = Guid.NewGuid(), FullName = "Refreshed User", Email = "refresh@ams.local", Role = "User" }
        });
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserDto> Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : Guid.Empty;
        var email = User.FindFirstValue(ClaimTypes.Email) ?? string.Empty;
        var role = User.FindFirstValue(ClaimTypes.Role) ?? string.Empty;
        var fullName = User.FindFirstValue("fullName") ?? string.Empty;

        return Ok(new UserDto
        {
            Id = id,
            Email = email,
            Role = role,
            FullName = fullName,
            IsActive = true
        });
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
        if (!Guid.TryParse(idStr, out var userId)) return Unauthorized();

        var updated = await _authAppService.UpdateProfileAsync(userId, request.FullName, request.ParentMobile);
        return Ok(updated);
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.Identity?.Name;
        if (!Guid.TryParse(idStr, out var userId)) return Unauthorized();

        await _authAppService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
        return NoContent();
    }
}

public class UpdateProfileRequest
{
    public string FullName { get; set; } = string.Empty;
    public string ParentMobile { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string CurrentPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

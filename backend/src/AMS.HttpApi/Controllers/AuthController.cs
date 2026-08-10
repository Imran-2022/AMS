using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Concurrent;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private static readonly ConcurrentDictionary<string, UserDto> RefreshTokenStore = new();

    private readonly IAuthAppService _authAppService;
    private readonly IUserAppService _userAppService;
    private readonly IConfiguration _configuration;

    [ActivatorUtilitiesConstructor]
    public AuthController(IAuthAppService authAppService, IUserAppService userAppService, IConfiguration? configuration = null)
    {
        _authAppService = authAppService;
        _userAppService = userAppService;
        _configuration = configuration ?? new ConfigurationBuilder().AddInMemoryCollection().Build();
    }

    // Backwards-compatible constructor used by some tests which pass IConfiguration as second parameter
    public AuthController(IAuthAppService authAppService, IConfiguration configuration)
        : this(authAppService, new FallbackUserAppService(), configuration)
    {
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
        RefreshTokenStore[refreshToken] = new UserDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            IsActive = user.IsActive,
            AvatarUrl = user.AvatarUrl,
            PhoneNumber = user.PhoneNumber,
            EmployeeId = user.EmployeeId,
            SubjectSpecialization = user.SubjectSpecialization,
            Qualification = user.Qualification,
            GuardianName = user.GuardianName,
            GuardianEmail = user.GuardianEmail,
            Address = user.Address,
            StudentId = user.StudentId,
            Gender = user.Gender,
            DateOfBirth = user.DateOfBirth,
            AdmissionDate = user.AdmissionDate,
            JoiningDate = user.JoiningDate,
            ParentMobile = user.ParentMobile
        };

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

        if (!RefreshTokenStore.TryGetValue(request.RefreshToken, out var storedUser))
            return Unauthorized();

        var jwtKey = _configuration["Jwt:Key"];
        var jwtIssuer = _configuration["Jwt:Issuer"];
        var jwtAudience = _configuration["Jwt:Audience"];
        var accessTokenExpiresMinutes = int.TryParse(_configuration["Jwt:AccessTokenExpiresMinutes"], out var accessMinutes) ? accessMinutes : 15;

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, storedUser.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, storedUser.Id.ToString()),
            new Claim(ClaimTypes.Email, storedUser.Email),
            new Claim(ClaimTypes.Role, storedUser.Role),
            new Claim("fullName", storedUser.FullName)
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
            User = storedUser
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        if (!User.Identity?.IsAuthenticated ?? true)
            return Unauthorized();

        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) ? userId : Guid.Empty;
        var currentUserRole = User.IsInRole("Admin") ? "Admin" : "Student";

        var user = await _userAppService.GetByIdAsync(id, id, currentUserRole);
        if (user is null)
            return NotFound();

        return Ok(user);
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

// Minimal fallback IUserAppService used only for test compatibility when the controller is constructed with (IAuthAppService, IConfiguration)
internal class FallbackUserAppService : IUserAppService
{
    public Task<UserDto> CreateAsync(CreateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    public Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    public Task<IReadOnlyList<UserDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => Task.FromResult((IReadOnlyList<UserDto>)Array.Empty<UserDto>());
    public Task<UserDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => Task.FromResult<UserDto?>(null);
    public Task<UserDto> ToggleActiveAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => throw new NotImplementedException();
    public Task<UserDto> UpdateAsync(Guid id, UpdateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default) => throw new NotImplementedException();
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

using AMS.Application.Contracts;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AMS.Infrastructure.Auth;

public class CurrentUserAccessor : ICurrentUserAccessor, ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserAccessor(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return Guid.Empty;
            var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.Identity?.Name;
            return Guid.TryParse(id, out var guid) ? guid : Guid.Empty;
        }
    }

    public string Role
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null) return string.Empty;
            if (user.IsInRole("Admin")) return "Admin";
            if (user.IsInRole("Teacher")) return "Teacher";
            return "Student";
        }
    }

    public bool IsInRole(string role)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        return user?.IsInRole(role) ?? false;
    }
}

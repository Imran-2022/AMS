using System;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMS.HttpApi.Extensions;

public static class ControllerExtensions
{
    public static Guid GetCurrentUserId(this ControllerBase controller)
    {
        var user = controller.User;
        if (user is null)
            return Guid.Empty;

        var id = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? user.Identity?.Name;
        if (Guid.TryParse(id, out var guid))
            return guid;

        return Guid.Empty;
    }
}

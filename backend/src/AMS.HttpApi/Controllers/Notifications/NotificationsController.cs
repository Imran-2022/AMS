using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationAppService _notificationAppService;
    private readonly ICurrentUserService _currentUser;

    public NotificationsController(INotificationAppService notificationAppService, ICurrentUserService currentUser)
    {
        _notificationAppService = notificationAppService;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> GetMyNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var notifications = await _notificationAppService.GetMyNotificationsAsync(_currentUser.UserId, page, pageSize);
        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<ActionResult<int>> GetUnreadCount()
    {
        var count = await _notificationAppService.GetUnreadCountAsync(_currentUser.UserId);
        return Ok(count);
    }

    [HttpPost("{id:guid}/read")]
    public async Task<ActionResult> MarkAsRead(Guid id)
    {
        await _notificationAppService.MarkAsReadAsync(id, _currentUser.UserId);
        return Ok();
    }

    [HttpPost("read-all")]
    public async Task<ActionResult> MarkAllAsRead()
    {
        await _notificationAppService.MarkAllAsReadAsync(_currentUser.UserId);
        return Ok();
    }

    [HttpGet("preferences")]
    public async Task<ActionResult<IReadOnlyList<NotificationPreferenceDto>>> GetPreferences()
    {
        var preferences = await _notificationAppService.GetPreferencesAsync(_currentUser.UserId);
        return Ok(preferences);
    }

    [HttpPut("preferences/{type}")]
    public async Task<ActionResult<NotificationPreferenceDto>> UpdatePreference(string type, [FromBody] UpdateNotificationPreferenceDto input)
    {
        if (!Enum.TryParse<NotificationType>(type, true, out var parsed))
        {
            return BadRequest("Invalid notification type.");
        }

        var preference = await _notificationAppService.UpdatePreferenceAsync(_currentUser.UserId, parsed, input.IsEnabled);
        return Ok(preference);
    }
}

public class UpdateNotificationPreferenceDto
{
    public bool IsEnabled { get; set; }
}

using AMS.Application.Contracts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardAppService _dashboardAppService;

    public DashboardController(IDashboardAppService dashboardAppService)
    {
        _dashboardAppService = dashboardAppService;
    }

    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<AdminDashboardStatsDto>> GetAdminStats([FromQuery] Guid? academicYearId = null)
    {
        var result = await _dashboardAppService.GetAdminStatsAsync(academicYearId);
        return Ok(result);
    }

    [HttpGet("teacher")]
    [Authorize(Roles = "Admin,Teacher")]
    public async Task<ActionResult<TeacherDashboardStatsDto>> GetTeacherStats()
    {
        var teacherIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(teacherIdStr, out var teacherId)) return Unauthorized();

        var result = await _dashboardAppService.GetTeacherStatsAsync(teacherId);
        return Ok(result);
    }

    [HttpGet("student")]
    [Authorize(Roles = "Admin,Student")]
    public async Task<ActionResult<StudentDashboardStatsDto>> GetStudentStats()
    {
        var studentIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(studentIdStr, out var studentId)) return Unauthorized();

        var result = await _dashboardAppService.GetStudentStatsAsync(studentId);
        return Ok(result);
    }
}

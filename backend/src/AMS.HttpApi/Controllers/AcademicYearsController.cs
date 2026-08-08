using AMS.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/academic-years")]
[Authorize]
public class AcademicYearsController : ControllerBase
{
    private readonly IAcademicYearAppService _academicYearService;

    public AcademicYearsController(IAcademicYearAppService academicYearService)
    {
        _academicYearService = academicYearService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var years = await _academicYearService.GetAllAsync();
        return Ok(years);
    }

    [HttpGet("active")]
    public async Task<ActionResult> GetActive()
    {
        var year = await _academicYearService.GetActiveAsync();
        if (year is null)
            return NotFound(new { message = "No active academic year found." });

        return Ok(year);
    }

    [HttpPost]
    public async Task<ActionResult> Create([FromBody] CreateAcademicYearDto input)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "User";

        if (!Guid.TryParse(userId, out var parsedUserId))
            return Unauthorized();

        var year = await _academicYearService.CreateAsync(input, parsedUserId, userRole);
        return Ok(year);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<ActionResult> Activate(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(ClaimTypes.Name);
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? "User";

        if (!Guid.TryParse(userId, out var parsedUserId))
            return Unauthorized();

        var year = await _academicYearService.ActivateAsync(id, parsedUserId, userRole);
        return Ok(year);
    }
}

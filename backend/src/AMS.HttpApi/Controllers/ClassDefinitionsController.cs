using AMS.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace AMS.HttpApi.Controllers;

[ApiController]
[Route("api/class-definitions")]
[Authorize]
public class ClassDefinitionsController : ControllerBase
{
    private readonly AmsDbContext _db;

    public ClassDefinitionsController(AmsDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var list = await _db.ClassDefinitions.OrderBy(x => x.Name).Select(x => new { id = x.Id, name = x.Name }).ToListAsync();
        return Ok(list);
    }

    [HttpGet("{id:guid}/groups")]
    public async Task<ActionResult> GetGroups(Guid id)
    {
        var groups = await _db.Groups.Where(g => g.ClassDefinitionId == id).OrderBy(g => g.Name).Select(g => new { id = g.Id, name = g.Name }).ToListAsync();
        return Ok(groups);
    }
}

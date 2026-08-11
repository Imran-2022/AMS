using AMS.Domain.Entities;
using AMS.EntityFrameworkCore;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using Xunit;

namespace AMS.HttpApi.Tests;

public class ClassDefinitionsControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ordered_ClassDefinitions()
    {
        var options = new DbContextOptionsBuilder<AmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var db = new AmsDbContext(options);
        db.ClassDefinitions.Add(new ClassDefinition(Guid.NewGuid(), "Z", 2));
        db.ClassDefinitions.Add(new ClassDefinition(Guid.NewGuid(), "A", 1));
        await db.SaveChangesAsync();

        var controller = new ClassDefinitionsController(db);
        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value!);
        Assert.Collection(list,
            item => Assert.Contains("A", item.ToString(), StringComparison.OrdinalIgnoreCase),
            item => Assert.Contains("Z", item.ToString(), StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task GetGroups_Returns_Groups_For_ClassDefinition()
    {
        var options = new DbContextOptionsBuilder<AmsDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        await using var db = new AmsDbContext(options);
        var classDefId = Guid.NewGuid();
        db.Groups.Add(new Group(Guid.NewGuid(), classDefId, "Group B"));
        db.Groups.Add(new Group(Guid.NewGuid(), classDefId, "Group A"));
        await db.SaveChangesAsync();

        var controller = new ClassDefinitionsController(db);
        var result = await controller.GetGroups(classDefId);

        var ok = Assert.IsType<OkObjectResult>(result);
        var list = Assert.IsAssignableFrom<IEnumerable<object>>(ok.Value!);
        Assert.Collection(list,
            item => Assert.Contains("Group A", item.ToString(), StringComparison.OrdinalIgnoreCase),
            item => Assert.Contains("Group B", item.ToString(), StringComparison.OrdinalIgnoreCase));
    }
}

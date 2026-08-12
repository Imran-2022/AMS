using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Xunit;

namespace AMS.HttpApi.Tests;

public class DashboardControllerTests
{
    [Fact]
    public async Task GetAdminStats_Returns_Ok()
    {
        var stats = new AdminDashboardStatsDto { TotalUsers = 5 };
        var service = new Mock<IDashboardAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAdminStatsAsync()).ReturnsAsync(stats);

        var controller = new DashboardController(service.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Admin") }, "Test")) }
        };

        var result = await controller.GetAdminStats();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<AdminDashboardStatsDto>(ok.Value);
        Assert.Equal(5, returned.TotalUsers);
    }

    [Fact]
    public async Task GetTeacherStats_Returns_Unauthorized_When_No_UserId()
    {
        var service = new Mock<IDashboardAppService>(MockBehavior.Strict);
        var controller = new DashboardController(service.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Teacher") }, "Test")) }
        };

        var result = await controller.GetTeacherStats();
        Assert.IsType<UnauthorizedResult>(result.Result);
    }
}

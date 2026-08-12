using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.Security.Claims;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AcademicYearsControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_With_Years()
    {
        var years = new List<AcademicYearDto> { new() { Id = Guid.NewGuid(), Name = "2026-2027", IsActive = true } };
        var service = new Mock<IAcademicYearAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAllAsync()).ReturnsAsync(years);

        var controller = new AcademicYearsController(service.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetAll();
        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(years, ok.Value);
    }

    [Fact]
    public async Task GetActive_Returns_NotFound_When_None()
    {
        var service = new Mock<IAcademicYearAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetActiveAsync()).ReturnsAsync((AcademicYearDto?)null);

        var controller = new AcademicYearsController(service.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetActive();
        var notFound = Assert.IsType<NotFoundObjectResult>(result);
        Assert.Contains("No active academic year found", notFound.Value?.ToString() ?? string.Empty, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Create_Returns_Ok_When_AcademicYear_Created()
    {
        var expected = new AcademicYearDto { Id = Guid.NewGuid(), Name = "2026-2027", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var service = new Mock<IAcademicYearAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateAcademicYearDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var controller = new AcademicYearsController(service.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                }, "Test"))
            }
        };

        var input = new CreateAcademicYearDto { Name = "2026-2027", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var result = await controller.Create(input);

        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<AcademicYearDto>(ok.Value!);
        Assert.Equal(expected.Id, returned.Id);
    }

    [Fact]
    public async Task Activate_Returns_Ok_When_AcademicYear_Activated()
    {
        var expected = new AcademicYearDto { Id = Guid.NewGuid(), Name = "2026-2027", StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddYears(1), IsActive = true };
        var service = new Mock<IAcademicYearAppService>(MockBehavior.Strict);
        service.Setup(s => s.ActivateAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var controller = new AcademicYearsController(service.Object);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Role, "Admin")
                }, "Test"))
            }
        };

        var result = await controller.Activate(Guid.NewGuid());
        var ok = Assert.IsType<OkObjectResult>(result);
        var returned = Assert.IsType<AcademicYearDto>(ok.Value!);
        Assert.Equal(expected.Id, returned.Id);
    }
}

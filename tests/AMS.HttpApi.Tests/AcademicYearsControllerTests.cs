using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AcademicYearsControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_With_Years()
    {
        var years = new List<AcademicYearDto> { new() { Id = Guid.NewGuid(), Name = "2025-2026", IsActive = false } };
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
}

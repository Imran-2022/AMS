using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class ClassesControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_With_Classes()
    {
        var expected = new List<ClassCourseDto> { new() { Id = Guid.NewGuid(), Name = "Class 1" } };
        var service = new Mock<IClassCourseAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAllAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new ClassesController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetAll();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(expected, ok.Value);
    }

    [Fact]
    public async Task GetById_Returns_NotFound_When_Missing()
    {
        var service = new Mock<IClassCourseAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((ClassCourseDto?)null);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new ClassesController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetById(Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_Returns_Created_With_ClassCourse()
    {
        var expected = new ClassCourseDto { Id = Guid.NewGuid(), Name = "Class 1", Section = "A" };
        var service = new Mock<IClassCourseAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateClassCourseDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(expected);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new ClassesController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Create(new CreateClassCourseDto { Name = "Class 1", Section = "A", AcademicYearId = Guid.NewGuid() });
        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<ClassCourseDto>(created.Value!);
        Assert.Equal(expected.Id, returned.Id);
    }
}
using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class UsersControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_With_Users()
    {
        var users = new List<UserDto> { new() { Id = Guid.NewGuid(), FullName = "Test", Email = "test@example.com", Role = "Admin" } };
        var service = new Mock<IUserAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAllAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Admin");

        var controller = new UsersController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<UserDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetById_Returns_NotFound_When_User_Missing()
    {
        var service = new Mock<IUserAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((UserDto?)null);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Admin");

        var controller = new UsersController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetById(Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_Returns_Created_With_User()
    {
        var userDto = new UserDto { Id = Guid.NewGuid(), FullName = "Admin", Email = "admin@example.com", Role = "Admin" };
        var service = new Mock<IUserAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateUserDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(userDto);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Admin");

        var controller = new UsersController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Create(new CreateUserDto { FullName = "Admin", Email = "admin@example.com", Password = "P@ssword", Role = "Admin" });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<UserDto>(created.Value);
        Assert.Equal(userDto.Email, returned.Email);
    }
}

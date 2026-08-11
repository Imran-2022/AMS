using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class SubjectsControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_List()
    {
        var subjects = new List<SubjectDto> { new() { Id = Guid.NewGuid(), Name = "Math", Code = "MATH101" } };
        var service = new Mock<ISubjectAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAllAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(subjects);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new SubjectsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetAll();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<SubjectDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task GetById_Returns_Ok_When_Subject_Found()
    {
        var subject = new SubjectDto { Id = Guid.NewGuid(), Name = "Science", Code = "SCI101" };
        var service = new Mock<ISubjectAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetByIdAsync(subject.Id, It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(subject);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new SubjectsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetById(subject.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<SubjectDto>(ok.Value);
        Assert.Equal(subject.Name, returned.Name);
    }
}

using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AssignmentsControllerTests
{
    [Fact]
    public async Task GetById_Returns_NotFound_When_Assignment_Missing()
    {
        var service = new Mock<IAssignmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync((AssignmentDto?)null);

        var logger = new Mock<ILogger<AssignmentsController>>(MockBehavior.Strict);
        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new AssignmentsController(service.Object, logger.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetById(Guid.NewGuid());
        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_Returns_Created_When_Assignment_Created()
    {
        var assignment = new AssignmentDto { Id = Guid.NewGuid(), Title = "Homework" };
        var service = new Mock<IAssignmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateAssignmentDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(assignment);

        var logger = new Mock<ILogger<AssignmentsController>>(MockBehavior.Loose);
        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new AssignmentsController(service.Object, logger.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Create(new CreateAssignmentDto { Title = "Homework", ClassCourseId = Guid.NewGuid(), SubjectId = Guid.NewGuid(), TeacherId = currentUser.Object.UserId, Deadline = DateTime.UtcNow.AddDays(1), MaxMarks = 100, AllowLateSubmission = false, AllowResubmission = false });
        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<AssignmentDto>(created.Value!);
        Assert.Equal(assignment.Id, returned.Id);
    }
}

using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class SubmissionsControllerTests
{
    [Fact]
    public async Task GetMine_Returns_Ok_List()
    {
        var submissions = new List<SubmissionDto> { new() { Id = Guid.NewGuid(), AssignmentTitle = "Test" } };
        var service = new Mock<ISubmissionAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetMineAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(submissions);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Student");

        var controller = new SubmissionsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetMine();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<SubmissionDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task Grade_Returns_Ok_With_Graded_Submission()
    {
        var submission = new SubmissionDto { Id = Guid.NewGuid(), AssignmentTitle = "Test" };
        var service = new Mock<ISubmissionAppService>(MockBehavior.Strict);
        service.Setup(s => s.GradeAsync(It.IsAny<Guid>(), It.IsAny<GradeSubmissionDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(submission);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new SubmissionsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Grade(Guid.NewGuid(), new GradeSubmissionDto { Marks = 90, Feedback = "Good" });
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<SubmissionDto>(ok.Value);
        Assert.Equal(submission.Id, returned.Id);
    }
}

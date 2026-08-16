using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class TeacherAssignmentsControllerTests
{
    [Fact]
    public async Task GetAll_Returns_Ok_List()
    {
        var items = new List<TeacherSubjectAssignmentDto> { new() { TeacherId = Guid.NewGuid(), SubjectId = Guid.NewGuid(), ClassCourseId = Guid.NewGuid(), TeacherName = "T", SubjectName = "S", ClassCourseName = "C" } };
        var service = new Mock<ITeacherSubjectAssignmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.GetAllAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync(items);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Teacher");

        var controller = new TeacherAssignmentsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetAll();
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsAssignableFrom<IReadOnlyList<TeacherSubjectAssignmentDto>>(ok.Value);
        Assert.Single(returned);
    }

    [Fact]
    public async Task Create_Returns_Created_With_Item()
    {
        var item = new TeacherSubjectAssignmentDto { TeacherId = Guid.NewGuid(), SubjectId = Guid.NewGuid(), ClassCourseId = Guid.NewGuid(), TeacherName = "T", SubjectName = "S", ClassCourseName = "C" };
        var service = new Mock<ITeacherSubjectAssignmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateTeacherSubjectAssignmentDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(item);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Admin");

        var controller = new TeacherAssignmentsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Create(new CreateTeacherSubjectAssignmentDto { TeacherId = item.TeacherId, SubjectId = item.SubjectId, ClassCourseId = item.ClassCourseId });
        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<TeacherSubjectAssignmentDto>(created.Value);
        Assert.Equal(item.SubjectId, returned.SubjectId);
    }
}

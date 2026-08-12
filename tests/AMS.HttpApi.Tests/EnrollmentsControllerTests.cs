using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class EnrollmentsControllerTests
{
    [Fact]
    public async Task Create_Returns_Created_With_Enrollment()
    {
        var enrollment = new StudentEnrollmentDto { StudentId = Guid.NewGuid(), ClassCourseId = Guid.NewGuid(), StudentName = "Student", ClassCourseName = "Class" };
        var service = new Mock<IEnrollmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.CreateAsync(It.IsAny<CreateStudentEnrollmentDto>(), It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(enrollment);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(c => c.Role).Returns("Admin");

        var controller = new EnrollmentsController(service.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Create(new CreateStudentEnrollmentDto { StudentId = enrollment.StudentId, ClassCourseId = enrollment.ClassCourseId });

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var returned = Assert.IsType<StudentEnrollmentDto>(created.Value);
        Assert.Equal(enrollment.StudentId, returned.StudentId);
    }
}

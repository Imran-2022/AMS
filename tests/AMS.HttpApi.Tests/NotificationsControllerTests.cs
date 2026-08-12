using AMS.Application;
using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class NotificationsControllerTests
{
    [Fact]
    public async Task GetUnreadCount_Returns_Expected_Count()
    {
        var appService = new Mock<INotificationAppService>(MockBehavior.Strict);
        appService.Setup(x => x.GetUnreadCountAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(2);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(x => x.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(x => x.Role).Returns("Student");

        var controller = new NotificationsController(appService.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.GetUnreadCount();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(2, ok.Value);
    }

    [Fact]
    public async Task MarkAsRead_Updates_IsRead_For_Own_Notification()
    {
        var notificationId = Guid.NewGuid();
        var appService = new Mock<INotificationAppService>(MockBehavior.Strict);
        appService.Setup(x => x.MarkAsReadAsync(notificationId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(x => x.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(x => x.Role).Returns("Student");

        var controller = new NotificationsController(appService.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.MarkAsRead(notificationId);

        Assert.IsType<OkResult>(result);
    }

    [Fact]
    public async Task MarkAsRead_Returns_Forbid_When_Notification_Belongs_To_Another_User()
    {
        var notificationId = Guid.NewGuid();
        var appService = new Mock<INotificationAppService>(MockBehavior.Strict);
        appService.Setup(x => x.MarkAsReadAsync(notificationId, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ThrowsAsync(new ForbiddenException("Access denied."));

        var currentUser = new Mock<ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(x => x.UserId).Returns(Guid.NewGuid());
        currentUser.SetupGet(x => x.Role).Returns("Student");

        var controller = new NotificationsController(appService.Object, currentUser.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        await Assert.ThrowsAsync<ForbiddenException>(() => controller.MarkAsRead(notificationId));
    }
}

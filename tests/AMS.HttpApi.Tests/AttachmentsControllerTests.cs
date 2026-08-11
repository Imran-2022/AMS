using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using System.IO;
using System.Text;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AttachmentsControllerTests
{
    [Fact]
    public async Task Upload_Returns_BadRequest_When_No_File()
    {
        var service = new Mock<IAttachmentAppService>(MockBehavior.Strict);
        var controller = new AttachmentsController(service.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Upload("test", Guid.NewGuid(), null!);

        var badRequest = Assert.IsType<BadRequestObjectResult>(result.Result);
        Assert.Equal("No file uploaded.", badRequest.Value);
    }

    [Fact]
    public async Task Rename_Returns_Ok_When_Valid()
    {
        var expected = new AttachmentDto { Id = Guid.NewGuid(), OriginalFileName = "old.pdf" };
        var service = new Mock<IAttachmentAppService>(MockBehavior.Strict);
        service.Setup(s => s.RenameAsync(It.IsAny<Guid>(), It.IsAny<string>())).ReturnsAsync(expected);

        var controller = new AttachmentsController(service.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Rename(Guid.NewGuid(), new AttachmentsController.RenameAttachmentRequest("new.pdf"));
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<AttachmentDto>(ok.Value!);
        Assert.Equal(expected.Id, returned.Id);
    }
}

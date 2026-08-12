using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests;

public class FilesControllerTests
{
    [Fact]
    public async Task Upload_Returns_BadRequest_When_No_File()
    {
        var fileService = new Mock<IFileAppService>(MockBehavior.Strict);
        var attachmentRepo = new Mock<IAttachmentRepository>(MockBehavior.Strict);
        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);

        var controller = new FilesController(fileService.Object, attachmentRepo.Object, submissionRepo.Object, assignmentRepo.Object, enrollmentRepo.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Upload(null!);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }

    [Fact]
    public async Task Upload_Returns_Ok_When_File_Provided()
    {
        var fileService = new Mock<IFileAppService>(MockBehavior.Strict);
        var attachmentRepo = new Mock<IAttachmentRepository>(MockBehavior.Strict);
        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);

        fileService.Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), "test.txt", "text/plain")).ReturnsAsync(new FileUploadResultDto { FileName = "test.txt", FileUrl = "/uploads/test.txt", SizeBytes = 4 });

        var fileMock = new Mock<IFormFile>(MockBehavior.Strict);
        fileMock.Setup(f => f.Length).Returns(4);
        fileMock.Setup(f => f.FileName).Returns("test.txt");
        fileMock.Setup(f => f.ContentType).Returns("text/plain");
        fileMock.Setup(f => f.OpenReadStream()).Returns(new MemoryStream(new byte[] { 1, 2, 3, 4 }));

        var controller = new FilesController(fileService.Object, attachmentRepo.Object, submissionRepo.Object, assignmentRepo.Object, enrollmentRepo.Object);
        controller.ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() };

        var result = await controller.Upload(fileMock.Object);
        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var returned = Assert.IsType<FileUploadResultDto>(ok.Value);
        Assert.Equal("test.txt", returned.FileName);
    }
}

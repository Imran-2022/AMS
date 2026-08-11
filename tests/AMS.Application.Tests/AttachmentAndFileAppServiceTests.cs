using AMS.Application.Contracts;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using System.IO;
using Xunit;

namespace AMS.Application.Tests;

public class AttachmentAndFileAppServiceTests
{
    [Fact]
    public async Task FileAppService_SaveFileAsync_Should_Throw_When_File_Is_Empty()
    {
        var fileStorage = new Mock<IFileStorageService>(MockBehavior.Strict);
        var service = new FileAppService(fileStorage.Object);

        await Assert.ThrowsAsync<DomainException>(() => service.SaveFileAsync(new MemoryStream(), "test.txt", "text/plain"));
    }

    [Fact]
    public async Task FileAppService_SaveFileAsync_Should_Save_File_When_Valid()
    {
        var fileStorage = new Mock<IFileStorageService>(MockBehavior.Strict);
        var content = new byte[] { 1, 2, 3 };
        fileStorage.Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), "test.txt", "text/plain"))
            .ReturnsAsync("123_test.txt");

        var service = new FileAppService(fileStorage.Object);

        using var stream = new MemoryStream(content);
        var result = await service.SaveFileAsync(stream, "test.txt", "text/plain");

        Assert.Equal("/uploads/123_test.txt", result.FileUrl);
        Assert.Equal(content.Length, result.SizeBytes);
    }

    [Fact]
    public async Task FileAppService_OpenFileAsync_Should_Return_Null_For_Empty_Name()
    {
        var fileStorage = new Mock<IFileStorageService>(MockBehavior.Strict);
        var service = new FileAppService(fileStorage.Object);

        var result = await service.OpenFileAsync(string.Empty);

        Assert.Null(result);
    }

    [Fact]
    public async Task AttachmentAppService_AddAsync_Should_Return_AttachmentDto()
    {
        var fileService = new Mock<IFileAppService>(MockBehavior.Strict);
        var attachmentRepo = new Mock<IAttachmentRepository>(MockBehavior.Strict);

        fileService.Setup(f => f.SaveFileAsync(It.IsAny<Stream>(), "file.pdf", "application/pdf"))
            .ReturnsAsync(new FileUploadResultDto { FileUrl = "/uploads/abc_file.pdf", SizeBytes = 123 });
        attachmentRepo.Setup(r => r.AddAsync(It.IsAny<Attachment>())).Returns(Task.CompletedTask);

        var service = new AttachmentAppService(attachmentRepo.Object, fileService.Object);

        using var stream = new MemoryStream(new byte[] { 1 });
        var result = await service.AddAsync("Assignment", Guid.NewGuid(), stream, "file.pdf", "application/pdf", Guid.NewGuid());

        Assert.Equal("file.pdf", result.OriginalFileName);
        Assert.Equal("abc_file.pdf", result.StoredFileName);
        Assert.Equal("/api/files/download/abc_file.pdf", result.DownloadUrl);
    }

    [Fact]
    public async Task AttachmentAppService_RenameAsync_Should_Throw_When_Not_Found()
    {
        var fileService = new Mock<IFileAppService>(MockBehavior.Strict);
        var attachmentRepo = new Mock<IAttachmentRepository>(MockBehavior.Strict);
        attachmentRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>())).ReturnsAsync((Attachment?)null);

        var service = new AttachmentAppService(attachmentRepo.Object, fileService.Object);

        await Assert.ThrowsAsync<InvalidOperationException>(() => service.RenameAsync(Guid.NewGuid(), "newname.pdf"));
    }
}

using System.Security.Claims;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Application.Authorization;
using AMS.Application.Contracts.Authorization;
using Microsoft.AspNetCore.Authorization;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests.Authorization;

public class AttachmentAuthorizationHandlerTests
{
    [Fact]
    public async Task AdminUser_Succeeds()
    {
        var attachmentRepo = new Mock<IAttachmentRepository>();
        var submissionRepo = new Mock<ISubmissionRepository>();
        var assignmentRepo = new Mock<IAssignmentRepository>();
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>();
        var handler = new AttachmentAuthorizationHandler(attachmentRepo.Object, submissionRepo.Object, assignmentRepo.Object, enrollmentRepo.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()), new Claim(ClaimTypes.Role, "Admin") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var requirement = new AttachmentAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, "somefile.pdf");

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task StudentOwnerSubmission_Succeeds()
    {
        var file = "file1.pdf";
        var submissionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var attachment = new Domain.Entities.Attachment(Guid.NewGuid(), "Submission", submissionId, "orig.pdf", file, "application/pdf", 1234L, Guid.NewGuid(), DateTime.UtcNow);
        var submission = new Submission(submissionId, Guid.NewGuid(), studentId, "", null, DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var attachmentRepo = new Mock<IAttachmentRepository>();
        attachmentRepo.Setup(r => r.GetByStoredFileNameAsync(file, It.IsAny<CancellationToken>())).ReturnsAsync(attachment);
        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>())).ReturnsAsync(submission);
        var assignmentRepo = new Mock<IAssignmentRepository>();
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>();

        var handler = new AttachmentAuthorizationHandler(attachmentRepo.Object, submissionRepo.Object, assignmentRepo.Object, enrollmentRepo.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, studentId.ToString()) };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var requirement = new AttachmentAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, file);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }
}

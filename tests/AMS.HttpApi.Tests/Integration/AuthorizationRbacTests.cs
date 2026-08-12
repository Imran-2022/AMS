using System.Security.Claims;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Application.Authorization;
using AMS.Application.Contracts.Authorization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests.Integration;

public class AuthorizationRbacTests
{
    [Fact]
    public async Task Student_Cannot_Access_Others_Submission()
    {
        var submissionId = Guid.NewGuid();
        var ownerStudentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();

        var submission = new Submission(submissionId, Guid.NewGuid(), ownerStudentId, "", DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>())).ReturnsAsync(submission);
        var assignmentRepo = new Mock<IAssignmentRepository>();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
        services.AddSingleton<IAssignmentRepository>(assignmentRepo.Object);
        services.AddSingleton<IAuthorizationHandler, SubmissionAuthorizationHandler>();
        services.AddAuthorization();

        var provider = services.BuildServiceProvider();
        var authService = provider.GetRequiredService<IAuthorizationService>();

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, otherStudentId.ToString()), new Claim(ClaimTypes.Role, "Student") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));

        var result = await authService.AuthorizeAsync(user, submissionId, new SubmissionAccessRequirement());
        Assert.False(result.Succeeded);
    }

    [Fact]
    public async Task Teacher_Can_Access_Assignment_Submission()
    {
        var submissionId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var submission = new Submission(submissionId, assignmentId, Guid.NewGuid(), "", DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);
        var assignment = new Assignment(assignmentId, "t", "d", Guid.NewGuid(), teacherId, DateTime.UtcNow.AddDays(1), 100, AMS.Domain.Shared.AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>())).ReturnsAsync(submission);
        var assignmentRepo = new Mock<IAssignmentRepository>();
        assignmentRepo.Setup(r => r.GetByIdAsync(assignmentId, It.IsAny<CancellationToken>())).ReturnsAsync(assignment);

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
        services.AddSingleton<IAssignmentRepository>(assignmentRepo.Object);
        services.AddSingleton<IAuthorizationHandler, SubmissionAuthorizationHandler>();
        services.AddAuthorization();

        var provider = services.BuildServiceProvider();
        var authService = provider.GetRequiredService<IAuthorizationService>();

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, teacherId.ToString()), new Claim(ClaimTypes.Role, "Teacher") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));

        var result = await authService.AuthorizeAsync(user, submissionId, new SubmissionAccessRequirement());
        Assert.True(result.Succeeded);
    }

    [Fact]
    public async Task Anonymous_Cannot_Access_Attachment()
    {
        var file = "file.pdf";
        var attachment = new Domain.Entities.Attachment(Guid.NewGuid(), "Assignment", Guid.NewGuid(), "orig.pdf", file, "application/pdf", 100, Guid.NewGuid(), DateTime.UtcNow);

        var attachmentRepo = new Mock<IAttachmentRepository>();
        attachmentRepo.Setup(r => r.GetByStoredFileNameAsync(file, It.IsAny<CancellationToken>())).ReturnsAsync(attachment);
        var submissionRepo = new Mock<ISubmissionRepository>();
        var assignmentRepo = new Mock<IAssignmentRepository>();
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>();

        var services = new ServiceCollection();
        services.AddLogging();
        services.AddSingleton<IAttachmentRepository>(attachmentRepo.Object);
        services.AddSingleton<ISubmissionRepository>(submissionRepo.Object);
        services.AddSingleton<IAssignmentRepository>(assignmentRepo.Object);
        services.AddSingleton<ISubjectRepository>(new Mock<ISubjectRepository>().Object);
        services.AddSingleton<IStudentEnrollmentRepository>(enrollmentRepo.Object);
        services.AddSingleton<IAuthorizationHandler, AttachmentAuthorizationHandler>();
        services.AddAuthorization();

        var provider = services.BuildServiceProvider();
        var authService = provider.GetRequiredService<IAuthorizationService>();

        var anonymous = new ClaimsPrincipal(new ClaimsIdentity());

        var result = await authService.AuthorizeAsync(anonymous, file, new AttachmentAccessRequirement());
        Assert.False(result.Succeeded);
    }
}

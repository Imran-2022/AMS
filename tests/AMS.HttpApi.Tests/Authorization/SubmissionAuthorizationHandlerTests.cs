using System.Security.Claims;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Application.Authorization;
using AMS.Application.Contracts.Authorization;
using Microsoft.AspNetCore.Authorization;
using Moq;
using Xunit;

namespace AMS.HttpApi.Tests.Authorization;

public class SubmissionAuthorizationHandlerTests
{
    [Fact]
    public async Task AdminUser_Succeeds()
    {
        var submissionRepo = new Mock<ISubmissionRepository>();
        var assignmentRepo = new Mock<IAssignmentRepository>();
        var handler = new SubmissionAuthorizationHandler(submissionRepo.Object, assignmentRepo.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()), new Claim(ClaimTypes.Role, "Admin") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var requirement = new SubmissionAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, Guid.NewGuid());

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task StudentOwner_Succeeds()
    {
        var submissionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var submission = new Submission(submissionId, Guid.NewGuid(), studentId, "", DateTime.UtcNow, false, AMS.Domain.Shared.SubmissionStatus.Submitted);

        var submissionRepo = new Mock<ISubmissionRepository>();
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>())).ReturnsAsync(submission);
        var assignmentRepo = new Mock<IAssignmentRepository>();
        var handler = new SubmissionAuthorizationHandler(submissionRepo.Object, assignmentRepo.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, studentId.ToString()) };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var requirement = new SubmissionAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, submissionId);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }

    [Fact]
    public async Task TeacherOfAssignment_Succeeds()
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

        var handler = new SubmissionAuthorizationHandler(submissionRepo.Object, assignmentRepo.Object);

        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, teacherId.ToString()), new Claim(ClaimTypes.Role, "Teacher") };
        var user = new ClaimsPrincipal(new ClaimsIdentity(claims, "Test"));
        var requirement = new SubmissionAccessRequirement();
        var context = new AuthorizationHandlerContext(new[] { requirement }, user, submissionId);

        await handler.HandleAsync(context);

        Assert.True(context.HasSucceeded);
    }
}

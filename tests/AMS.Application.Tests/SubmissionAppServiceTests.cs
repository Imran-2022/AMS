using AMS.Application.Services;
using AMS.Application.Contracts;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Microsoft.AspNetCore.Authorization;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class SubmissionAppServiceTests
{
    [Fact]
    public async Task GetByIdAsync_Should_Throw_Forbidden_When_Student_Does_Not_Own_Submission()
    {
        var submissionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var otherStudentId = Guid.NewGuid();

        var submission = new Submission(submissionId, Guid.NewGuid(), studentId, "content", DateTime.UtcNow, false, SubmissionStatus.Submitted, null, 0);

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(submission);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);

        var authService = new Mock<IAuthorizationService>(MockBehavior.Strict);
        authService.Setup(a => a.AuthorizeAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), submissionId, It.IsAny<IEnumerable<IAuthorizationRequirement>>()))
            .ReturnsAsync(AuthorizationResult.Failed());

        var currentUser = new Mock<AMS.Application.Contracts.ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(otherStudentId);
        currentUser.SetupGet(c => c.Role).Returns(nameof(UserRole.Student));

        var service = new SubmissionAppService(
            submissionRepo.Object,
            assignmentRepo.Object,
            Mock.Of<IStudentEnrollmentRepository>(),
            userRepo.Object,
            classCourseRepo.Object,
            Mock.Of<IGroupRepository>(),
            Mock.Of<ISubjectRepository>(),
            authService.Object,
            currentUser.Object,
            Mock.Of<IAttachmentAppService>(),
            Mock.Of<INotificationService>(),
            Mock.Of<IAcademicYearRepository>());

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => service.GetByIdAsync(submissionId, otherStudentId, nameof(UserRole.Student)));
        Assert.Equal("Access denied.", ex.Message);
    }

    [Fact]
    public async Task GetByIdAsync_Should_Return_SubmissionDto_When_Authorized()
    {
        var submissionId = Guid.NewGuid();
        var studentId = Guid.NewGuid();
        var assignmentId = Guid.NewGuid();
        var classCourseId = Guid.NewGuid();

        var submission = new Submission(submissionId, assignmentId, studentId, "content", DateTime.UtcNow, false, SubmissionStatus.Submitted, null, 0);
        var assignment = new Assignment(assignmentId, "title", "desc", Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(7), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);
        var student = new User(studentId, "Student Name", "student@example.com", "hash", UserRole.Student);
        var subject = new Subject(Guid.NewGuid(), "Math", "MATH101", classCourseId);
        var classCourse = new ClassCourse(classCourseId, "Class", "A", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid());

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetByIdAsync(submissionId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(submission);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByIdAsync(assignmentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(assignment);

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetByIdAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(student);

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(assignment.SubjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(subject);

        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(classCourse);

        var authService = new Mock<IAuthorizationService>(MockBehavior.Strict);
        authService.Setup(a => a.AuthorizeAsync(It.IsAny<System.Security.Claims.ClaimsPrincipal>(), submissionId, It.IsAny<IEnumerable<IAuthorizationRequirement>>()))
            .ReturnsAsync(AuthorizationResult.Success());

        var currentUser = new Mock<AMS.Application.Contracts.ICurrentUserService>(MockBehavior.Strict);
        currentUser.SetupGet(c => c.UserId).Returns(studentId);
        currentUser.SetupGet(c => c.Role).Returns(nameof(UserRole.Student));

        var service = new SubmissionAppService(
            submissionRepo.Object,
            assignmentRepo.Object,
            Mock.Of<IStudentEnrollmentRepository>(),
            userRepo.Object,
            classCourseRepo.Object,
            Mock.Of<IGroupRepository>(),
            subjectRepo.Object,
            authService.Object,
            currentUser.Object,
            Mock.Of<IAttachmentAppService>(),
            Mock.Of<INotificationService>(),
            Mock.Of<IAcademicYearRepository>());

        var result = await service.GetByIdAsync(submissionId, studentId, nameof(UserRole.Student));

        Assert.NotNull(result);
        Assert.Equal(submissionId, result!.Id);
        Assert.Equal(studentId, result.StudentId);
        Assert.Equal("title", result.AssignmentTitle);
    }
}

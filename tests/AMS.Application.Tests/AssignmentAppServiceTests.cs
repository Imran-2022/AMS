using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class AssignmentAppServiceTests
{
    [Fact]
    public async Task CreateAsync_Should_Throw_When_Teacher_Is_Not_Assigned_To_Subject()
    {
        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var studentEnrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);

        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();

        userRepo.Setup(r => r.GetByIdAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AppUser(teacherId, "Teacher Name", "teacher@example.com", "hash", UserRole.Teacher));
        teacherAssignmentRepo.Setup(r => r.GetAsync(teacherId, subjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TeacherSubjectAssignment?)null);

        var service = new AssignmentAppService(
            assignmentRepo.Object,
            teacherAssignmentRepo.Object,
            studentEnrollmentRepo.Object,
            submissionRepo.Object,
            userRepo.Object,
            classCourseRepo.Object,
            subjectRepo.Object);

        var input = new CreateAssignmentDto
        {
            Title = "Math Homework",
            Description = "Do the exercises",
            ClassCourseId = Guid.NewGuid(),
            SubjectId = subjectId,
            TeacherId = teacherId,
            Deadline = DateTime.UtcNow.AddDays(7),
            MaxMarks = 100,
            AllowLateSubmission = false,
            AllowResubmission = false
        };

        var ex = await Assert.ThrowsAsync<ForbiddenException>(() => service.CreateAsync(input, teacherId, nameof(UserRole.Teacher)));
        Assert.Equal("Teacher is not assigned to this subject.", ex.Message);
    }
}

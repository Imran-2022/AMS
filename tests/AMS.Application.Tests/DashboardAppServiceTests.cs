using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class DashboardAppServiceTests
{
    [Fact]
    public async Task GetAdminStatsAsync_Should_Return_Correct_Counts()
    {
        var users = new List<User>
        {
            new User(Guid.NewGuid(), "Admin", "admin@example.com", "hash", UserRole.Admin),
            new User(Guid.NewGuid(), "Teacher", "teacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Student", "student@example.com", "hash", UserRole.Student)
        };
        var classes = new[] { new ClassCourse(Guid.NewGuid(), "Class", "A", Guid.NewGuid(), Guid.NewGuid()) };
        var subjects = new[] { new Subject(Guid.NewGuid(), "Math", "MATH101", classes[0].Id) };
        var assignments = new[] { new Assignment(Guid.NewGuid(), "Title", "Desc", classes[0].Id, Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow) };
        var submissions = new[] { new Submission(Guid.NewGuid(), assignments[0].Id, Guid.NewGuid(), "content", null, null, DateTime.UtcNow, false, SubmissionStatus.Submitted) };

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(classes);

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(subjects);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(assignments);

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(submissions);

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        var service = new DashboardAppService(userRepo.Object, classRepo.Object, Mock.Of<IGroupRepository>(), subjectRepo.Object, assignmentRepo.Object, submissionRepo.Object, enrollmentRepo.Object, teacherAssignmentRepo.Object);

        var stats = await service.GetAdminStatsAsync();

        Assert.Equal(3, stats.TotalUsers);
        Assert.Equal(1, stats.TotalTeachers);
        Assert.Equal(1, stats.TotalStudents);
        Assert.Equal(1, stats.TotalClasses);
        Assert.Equal(1, stats.TotalSubjects);
        Assert.Equal(1, stats.TotalAssignments);
        Assert.Equal(1, stats.TotalSubmissions);
    }
}

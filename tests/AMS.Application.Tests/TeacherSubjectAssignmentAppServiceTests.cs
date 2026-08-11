using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class TeacherSubjectAssignmentAppServiceTests
{
    [Fact]
    public async Task CreateAsync_Should_Throw_When_Teacher_Not_Found()
    {
        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() => service.CreateAsync(new CreateTeacherSubjectAssignmentDto
        {
            TeacherId = Guid.NewGuid(),
            SubjectId = Guid.NewGuid(),
            ClassCourseId = Guid.NewGuid()
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Teacher not found.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_User_Is_Not_Teacher()
    {
        var teacherId = Guid.NewGuid();
        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(teacherId, "User", "user@example.com", "hash", UserRole.Student));

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateTeacherSubjectAssignmentDto
        {
            TeacherId = teacherId,
            SubjectId = Guid.NewGuid(),
            ClassCourseId = Guid.NewGuid()
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Selected user is not a teacher.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Subject_Does_Not_Belong_To_Class()
    {
        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var classCourseId = Guid.NewGuid();

        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(teacherId, "Teacher", "teacher@example.com", "hash", UserRole.Teacher));
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassCourse(classCourseId, "Class", "A", Guid.NewGuid(), Guid.NewGuid()));
        subjectRepo.Setup(r => r.GetByIdAsync(subjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Subject(subjectId, "Biology", "BIO101", Guid.NewGuid()));

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateTeacherSubjectAssignmentDto
        {
            TeacherId = teacherId,
            SubjectId = subjectId,
            ClassCourseId = classCourseId
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Selected subject does not belong to the chosen class.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_AsTeacher_Returns_Assignments()
    {
        var teacherId = Guid.NewGuid();
        var subjectId = Guid.NewGuid();
        var classCourseId = Guid.NewGuid();

        var assignment = new TeacherSubjectAssignment(teacherId, subjectId, classCourseId);
        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { assignment });

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetByIdAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(teacherId, "Teacher", "teacher@example.com", "hash", UserRole.Teacher));

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(subjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Subject(subjectId, "Chemistry", "CHEM101", classCourseId));

        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassCourse(classCourseId, "Class", "A", Guid.NewGuid(), Guid.NewGuid()));

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object);

        var result = await service.GetAllAsync(teacherId, nameof(UserRole.Teacher));

        Assert.Single(result);
        Assert.Equal("Chemistry", result[0].SubjectName);
    }
}

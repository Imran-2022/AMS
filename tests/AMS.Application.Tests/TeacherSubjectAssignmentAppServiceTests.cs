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

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object, academicYearRepo.Object);

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

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object, academicYearRepo.Object);

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

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new TeacherSubjectAssignmentAppService(assignmentRepo.Object, userRepo.Object, subjectRepo.Object, classCourseRepo.Object, academicYearRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateTeacherSubjectAssignmentDto
        {
            TeacherId = teacherId,
            SubjectId = subjectId,
            ClassCourseId = classCourseId
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Selected subject does not belong to the chosen class.", ex.Message);
    }

    [Fact]
    public async Task GetAllAsync_AsTeacher_Returns_Assignments_For_Active_Academic_Year_Only()
    {
        var teacherId = Guid.NewGuid();
        var currentYearId = Guid.NewGuid();
        var previousYearId = Guid.NewGuid();
        var currentSubjectId = Guid.NewGuid();
        var previousSubjectId = Guid.NewGuid();
        var currentClassCourseId = Guid.NewGuid();
        var previousClassCourseId = Guid.NewGuid();

        var assignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new TeacherSubjectAssignment(teacherId, currentSubjectId),
                new TeacherSubjectAssignment(teacherId, previousSubjectId)
            });

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetByIdAsync(teacherId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(teacherId, "Teacher", "teacher@example.com", "hash", UserRole.Teacher));

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(currentSubjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Subject(currentSubjectId, "Chemistry", "CHEM101", currentClassCourseId));
        subjectRepo.Setup(r => r.GetByIdAsync(previousSubjectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new Subject(previousSubjectId, "Biology", "BIO101", previousClassCourseId));

        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classCourseRepo.Setup(r => r.GetByIdAsync(currentClassCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassCourse(currentClassCourseId, "Class 6", "A", currentYearId, Guid.NewGuid()));
        classCourseRepo.Setup(r => r.GetByIdAsync(previousClassCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassCourse(previousClassCourseId, "Class 5", "A", previousYearId, Guid.NewGuid()));

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AcademicYear(currentYearId, "2026-2027", DateTime.UtcNow, DateTime.UtcNow.AddYears(1), true));

        var service = new TeacherSubjectAssignmentAppService(
            assignmentRepo.Object,
            userRepo.Object,
            subjectRepo.Object,
            classCourseRepo.Object,
            academicYearRepo.Object);

        var result = await service.GetAllAsync(teacherId, nameof(UserRole.Teacher));

        Assert.Single(result);
        Assert.Equal("Chemistry", result[0].SubjectName);
    }
}

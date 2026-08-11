using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class EnrollmentAppServiceTests
{
    [Fact]
    public async Task CreateAsync_Should_Throw_When_Student_Not_Found()
    {
        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>())).ReturnsAsync((User?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object);

        var ex = await Assert.ThrowsAsync<NotFoundException>(() => service.CreateAsync(new CreateStudentEnrollmentDto
        {
            StudentId = Guid.NewGuid(),
            ClassCourseId = Guid.NewGuid()
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Student not found.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Already_Enrolled()
    {
        var studentId = Guid.NewGuid();
        var classCourseId = Guid.NewGuid();

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(studentId, "Student", "student@example.com", "hash", UserRole.Student));
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new ClassCourse(classCourseId, "Class", "A", Guid.NewGuid(), Guid.NewGuid()));
        enrollmentRepo.Setup(r => r.GetAsync(studentId, classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StudentEnrollment(studentId, classCourseId));

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateStudentEnrollmentDto
        {
            StudentId = studentId,
            ClassCourseId = classCourseId
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("Student is already enrolled in this class.", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Enrolled_In_Same_Academic_Year()
    {
        var studentId = Guid.NewGuid();
        var classCourseA = new ClassCourse(Guid.NewGuid(), "Class A", "A", Guid.NewGuid(), Guid.NewGuid());
        var classCourseB = new ClassCourse(Guid.NewGuid(), "Class B", "B", classCourseA.AcademicYearId, Guid.NewGuid());

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(studentId, "Student", "student@example.com", "hash", UserRole.Student));
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseA.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(classCourseA);
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseB.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(classCourseB);
        enrollmentRepo.Setup(r => r.GetAsync(studentId, classCourseA.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentEnrollment?)null);
        enrollmentRepo.Setup(r => r.GetByStudentAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[] { new StudentEnrollment(studentId, classCourseB.Id) });

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateStudentEnrollmentDto
        {
            StudentId = studentId,
            ClassCourseId = classCourseA.Id
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("A student can only be enrolled in one class per academic year.", ex.Message);
    }
}

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

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object, Mock.Of<ISubjectRepository>(), academicYearRepo.Object);

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
        var academicYearId = Guid.NewGuid();
        enrollmentRepo.Setup(r => r.GetAsync(studentId, classCourseId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new StudentEnrollment(studentId, classCourseId, academicYearId));

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object, Mock.Of<ISubjectRepository>(), academicYearRepo.Object);

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
            .ReturnsAsync(new[] { new StudentEnrollment(studentId, classCourseB.Id, classCourseB.AcademicYearId) });

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object, Mock.Of<ISubjectRepository>(), academicYearRepo.Object);

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(new CreateStudentEnrollmentDto
        {
            StudentId = studentId,
            ClassCourseId = classCourseA.Id
        }, Guid.NewGuid(), nameof(UserRole.Admin)));

        Assert.Equal("A student can only be enrolled in one class per academic year.", ex.Message);
    }

    [Fact]
    public async Task PromoteStudentAsync_Should_Allow_Sequential_Promotion_For_Word_Class_Names()
    {
        var studentId = Guid.NewGuid();
        var currentYear = new AcademicYear(Guid.NewGuid(), "2025-2026", DateTime.UtcNow.AddDays(-30), DateTime.UtcNow.AddDays(300), true);
        var nextYear = new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow.AddDays(300), DateTime.UtcNow.AddDays(650), false);

        var fromClass = new ClassCourse(Guid.NewGuid(), "Six", "A", currentYear.Id, Guid.NewGuid());
        var toClass = new ClassCourse(Guid.NewGuid(), "Seven", "A", nextYear.Id, Guid.NewGuid());

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(studentId, "Student", "student@example.com", "hash", UserRole.Student));
        classCourseRepo.Setup(r => r.GetByIdAsync(fromClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromClass);
        classCourseRepo.Setup(r => r.GetByIdAsync(toClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toClass);
        enrollmentRepo.Setup(r => r.GetAsync(studentId, fromClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentEnrollment?)null);
        enrollmentRepo.Setup(r => r.GetAsync(studentId, toClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentEnrollment?)null);
        enrollmentRepo.Setup(r => r.AddAsync(It.IsAny<StudentEnrollment>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object, Mock.Of<ISubjectRepository>(), academicYearRepo.Object);

        var result = await service.PromoteStudentAsync(new PromoteStudentDto
        {
            StudentId = studentId,
            FromClassCourseId = fromClass.Id,
            ToClassCourseId = toClass.Id,
            NewRollNumber = "01"
        }, Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal(toClass.Id, result.ClassCourseId);
        Assert.Equal("01", result.RollNumber);
    }

    [Fact]
    public async Task PromoteStudentAsync_Should_Create_New_Enrollment_For_Next_Academic_Year_Without_Deactivating_The_Previous_Year_Record()
    {
        var studentId = Guid.NewGuid();
        var previousYear = new AcademicYear(Guid.NewGuid(), "2026", DateTime.UtcNow.AddDays(-365), DateTime.UtcNow.AddDays(-1), true);
        var nextYear = new AcademicYear(Guid.NewGuid(), "2027", DateTime.UtcNow.AddDays(1), DateTime.UtcNow.AddDays(365), false);

        var fromClass = new ClassCourse(Guid.NewGuid(), "Six", "A", previousYear.Id, Guid.NewGuid());
        var toClass = new ClassCourse(Guid.NewGuid(), "Seven", "A", nextYear.Id, Guid.NewGuid());
        var previousEnrollment = new StudentEnrollment(studentId, fromClass.Id, previousYear.Id, "01", true);

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        userRepo.Setup(r => r.GetByIdAsync(studentId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User(studentId, "Student", "student@example.com", "hash", UserRole.Student));
        classCourseRepo.Setup(r => r.GetByIdAsync(fromClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(fromClass);
        classCourseRepo.Setup(r => r.GetByIdAsync(toClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(toClass);
        enrollmentRepo.Setup(r => r.GetAsync(studentId, fromClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(previousEnrollment);
        enrollmentRepo.Setup(r => r.GetAsync(studentId, toClass.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync((StudentEnrollment?)null);
        enrollmentRepo.Setup(r => r.AddAsync(It.Is<StudentEnrollment>(x => x.StudentId == studentId && x.ClassCourseId == toClass.Id && x.AcademicYearId == nextYear.Id), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new StudentEnrollmentAppService(enrollmentRepo.Object, userRepo.Object, classCourseRepo.Object, teacherAssignmentRepo.Object, Mock.Of<ISubjectRepository>(), academicYearRepo.Object);

        var result = await service.PromoteStudentAsync(new PromoteStudentDto
        {
            StudentId = studentId,
            FromClassCourseId = fromClass.Id,
            ToClassCourseId = toClass.Id,
            NewRollNumber = "01"
        }, Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal(toClass.Id, result.ClassCourseId);
        Assert.Equal(nextYear.Id, result.ClassCourseId == toClass.Id ? toClass.AcademicYearId : Guid.Empty);
        Assert.True(previousEnrollment.IsActive);
    }

    [Fact]
    public async Task GetAllAsync_Should_Return_Empty_When_Active_Academic_Year_Has_No_Enrollments()
    {
        var activeYear = new AcademicYear(Guid.NewGuid(), "2027", DateTime.UtcNow.AddDays(10), DateTime.UtcNow.AddDays(370), true);

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);

        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(activeYear);
        enrollmentRepo.Setup(r => r.GetByAcademicYearAsync(activeYear.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<StudentEnrollment>());

        var service = new StudentEnrollmentAppService(
            enrollmentRepo.Object,
            userRepo.Object,
            classCourseRepo.Object,
            teacherAssignmentRepo.Object,
            Mock.Of<ISubjectRepository>(),
            academicYearRepo.Object);

        var result = await service.GetAllAsync(Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Empty(result);
    }
}

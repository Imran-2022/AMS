using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class UserAppServiceTests
{
    [Fact]
    public async Task GetAllAsync_Should_Return_All_Users_For_Admin()
    {
        var users = new List<User>
        {
            new User(Guid.NewGuid(), "Admin", "admin@example.com", "hash", UserRole.Admin),
            new User(Guid.NewGuid(), "Student", "student@example.com", "hash", UserRole.Student)
        };

        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var service = new UserAppService(
            repo.Object, 
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var result = await service.GetAllAsync(Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal(2, result.Count);
        Assert.Contains(result, u => u.Role == nameof(UserRole.Admin));
    }

    [Fact]
    public async Task GetAllAsync_Should_Throw_When_Not_Admin()
    {
        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        var service = new UserAppService(
            repo.Object, 
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        await Assert.ThrowsAsync<ForbiddenException>(() => service.GetAllAsync(Guid.NewGuid(), nameof(UserRole.Teacher)));
    }

    [Fact]
    public async Task CreateAsync_Should_Throw_When_Role_Is_Invalid()
    {
        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        var service = new UserAppService(
            repo.Object, 
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var dto = new CreateUserDto
        {
            FullName = "Test",
            Email = "test@example.com",
            Password = "P@ssw0rd",
            Role = "Invalid"
        };

        var ex = await Assert.ThrowsAsync<ValidationException>(() => service.CreateAsync(dto, Guid.NewGuid(), nameof(UserRole.Admin)));
        Assert.Contains("Invalid role", ex.Message);
    }

    [Fact]
    public async Task CreateAsync_Should_Create_Student_When_Valid()
    {
        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.AddAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var service = new UserAppService(
            repo.Object, 
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var dto = new CreateUserDto
        {
            FullName = "Student Name",
            Email = "student@example.com",
            Password = "P@ssw0rd",
            Role = nameof(UserRole.Student),
            StudentId = "S123",
            GuardianName = "Parent Name",
            GuardianEmail = "parent@example.com",
            ParentMobile = "01712345678",
            AdmissionDate = DateTime.UtcNow
        };

        var result = await service.CreateAsync(dto, Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal(dto.Email, result.Email);
        Assert.Equal(dto.Role, result.Role);
        Assert.Equal(dto.StudentId, result.StudentId);
        repo.Verify(r => r.AddAsync(It.Is<User>(u => u.Email == dto.Email && u.Role == UserRole.Student), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateAsync_Should_Return_Updated_Avatar_Url()
    {
        var id = Guid.NewGuid();
        var user = new User(
            id,
            "Test User",
            "test@example.com",
            "hash",
            UserRole.Student,
            "/old-avatar.jpg",
            "1234567890",
            "Male",
            DateTime.UtcNow.AddYears(-20),
            "Address",
            true,
            teacherProfile: null,
            studentProfile: new StudentProfile(id, "S-001", "Parent Name", "parent@example.com", "1234567890", DateTime.UtcNow.AddYears(-2)));

        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        repo.Setup(r => r.UpdateAsync(It.IsAny<User>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var service = new UserAppService(
            repo.Object,
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var result = await service.UpdateAsync(id, new UpdateUserDto { AvatarUrl = "/new-avatar.jpg" }, id, nameof(UserRole.Student));

        Assert.Equal("/new-avatar.jpg", result.AvatarUrl);
        repo.Verify(r => r.UpdateAsync(It.Is<User>(u => u.AvatarUrl == "/new-avatar.jpg"), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetNextStudentIdAsync_Should_Not_Include_Academic_Year()
    {
        var classCourseId = Guid.NewGuid();
        var classCourse = new ClassCourse(classCourseId, "Six", "A", Guid.NewGuid(), Guid.NewGuid(), null);

        var classCourseRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classCourseRepo.Setup(r => r.GetByIdAsync(classCourseId, It.IsAny<CancellationToken>())).ReturnsAsync(classCourse);

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        enrollmentRepo.Setup(r => r.GetByClassCourseAsync(classCourseId, It.IsAny<CancellationToken>())).ReturnsAsync(new List<StudentEnrollment>());

        var service = new UserAppService(
            Mock.Of<IUserRepository>(),
            Mock.Of<IFileAppService>(),
            enrollmentRepo.Object,
            classCourseRepo.Object,
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var result = await service.GetNextStudentIdAsync(classCourseId, null, Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal("STU-0001", result);
    }

    [Fact]
    public async Task ToggleActiveAsync_Should_Flip_User_Status()
    {
        var id = Guid.NewGuid();
        var user = new User(id, "Test", "test@example.com", "hash", UserRole.Student, isActive: true);

        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetByIdAsync(id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        repo.Setup(r => r.UpdateAsync(user, It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);

        var service = new UserAppService(
            repo.Object, 
            Mock.Of<IFileAppService>(),
            Mock.Of<IStudentEnrollmentRepository>(),
            Mock.Of<IClassCourseRepository>(),
            Mock.Of<IGroupRepository>(),
            Mock.Of<INotificationPreferenceRepository>());

        var result = await service.ToggleActiveAsync(id, Guid.NewGuid(), nameof(UserRole.Admin));

        Assert.Equal(id, result.Id);
        Assert.False(result.IsActive);
        repo.Verify(r => r.UpdateAsync(user, It.IsAny<CancellationToken>()), Times.Once);
    }
}

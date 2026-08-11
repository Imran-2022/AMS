using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class AuthAppServiceTests
{
    [Fact]
    public async Task LoginAsync_Should_Return_Null_For_Invalid_Credentials()
    {
        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetByEmailAsync("unknown@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var service = new AuthAppService(repo.Object);

        var result = await service.LoginAsync("unknown@example.com", "wrong");

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_Should_Return_Null_For_Wrong_Password()
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("correct");
        var user = new User(Guid.NewGuid(), "Test User", "test@example.com", passwordHash, UserRole.Student);

        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var service = new AuthAppService(repo.Object);

        var result = await service.LoginAsync("test@example.com", "wrong");

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_Should_Return_User_For_Correct_Password()
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("correct");
        var user = new User(Guid.NewGuid(), "Test User", "test@example.com", passwordHash, UserRole.Student);

        var repo = new Mock<IUserRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetByEmailAsync("test@example.com", It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        var service = new AuthAppService(repo.Object);

        var result = await service.LoginAsync("test@example.com", "correct");

        Assert.NotNull(result);
        Assert.Equal(user.Id, result!.Id);
        Assert.Equal(user.Email, result.Email);
    }
}

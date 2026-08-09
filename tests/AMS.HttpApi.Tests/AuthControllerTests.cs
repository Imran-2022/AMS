using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Moq;
using System.Collections.Generic;
using System.Security.Claims;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_Should_Return_Unauthorized_For_Invalid_Credentials()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestJwtKey1234567890TestJwtKey1234567890",
            ["Jwt:Issuer"] = "test-issuer",
            ["Jwt:Audience"] = "test-audience",
            ["Jwt:AccessTokenExpiresMinutes"] = "15",
            ["Jwt:RefreshTokenExpiresMinutes"] = "21600"
        }).Build();

        var controller = new AuthController(new FakeAuthAppService(), configuration);

        var result = await controller.Login(new LoginRequest { Email = "x", Password = "y" });

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    [Fact]
    public async Task Refresh_Should_Return_New_Access_Token_For_Valid_Refresh_Token()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestJwtKey1234567890TestJwtKey1234567890",
            ["Jwt:Issuer"] = "test-issuer",
            ["Jwt:Audience"] = "test-audience",
            ["Jwt:AccessTokenExpiresMinutes"] = "15",
            ["Jwt:RefreshTokenExpiresMinutes"] = "21600"
        }).Build();

        var controller = new AuthController(new FakeAuthAppService(), configuration);

        var loginResult = await controller.Login(new LoginRequest { Email = "admin@ams.local", Password = "password" });
        var okResult = Assert.IsType<OkObjectResult>(loginResult.Result);
        var loginResponse = Assert.IsType<AuthResponseDto>(okResult.Value);

        var refreshResult = await controller.Refresh(new RefreshTokenRequest { RefreshToken = loginResponse.RefreshToken });
        var refreshOkResult = Assert.IsType<OkObjectResult>(refreshResult.Result);
        var refreshResponse = Assert.IsType<AuthResponseDto>(refreshOkResult.Value);

        Assert.False(string.IsNullOrWhiteSpace(refreshResponse.Token));
        Assert.False(string.IsNullOrWhiteSpace(refreshResponse.RefreshToken));
    }

    private class FakeAuthAppService : AMS.Application.Contracts.IAuthAppService
    {
        public Task<UserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
            => Task.FromResult<UserDto?>(email == "admin@ams.local" && password == "password"
                ? new UserDto { Id = Guid.NewGuid(), FullName = "Admin User", Email = email, Role = "Admin" }
                : null);

        public Task<UserDto> UpdateProfileAsync(Guid userId, string fullName, string parentMobile, CancellationToken cancellationToken = default)
            => Task.FromResult(new UserDto { Id = userId, FullName = fullName, ParentMobile = parentMobile });

        public Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }

    [Fact]
    public async Task Me_Should_Return_User_When_Authenticated()
    {
        var userId = Guid.NewGuid();
        var userDto = new UserDto { Id = userId, FullName = "Test User", Email = "test@example.com", Role = "Student" };

        var userService = new Mock<AMS.Application.Contracts.IUserAppService>();
        userService.Setup(s => s.GetByIdAsync(userId, userId, "Student", It.IsAny<CancellationToken>())).ReturnsAsync(userDto);

        var controller = new AuthController(new FakeAuthAppService(), userService.Object, CreateTestConfiguration());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, "Student")
                }, "Test"))
            }
        };

        var result = await controller.Me();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<UserDto>(okResult.Value);
        Assert.Equal(userDto.Id, returnedUser.Id);
        Assert.Equal(userDto.Email, returnedUser.Email);
    }

    [Fact]
    public async Task UpdateProfile_Should_Return_Updated_User()
    {
        var userId = Guid.NewGuid();
        var updatedUser = new UserDto { Id = userId, FullName = "Updated Name", ParentMobile = "1234567890", Role = "Student" };

        var authService = new Mock<AMS.Application.Contracts.IAuthAppService>();
        authService.Setup(s => s.UpdateProfileAsync(userId, updatedUser.FullName, updatedUser.ParentMobile, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedUser);

        var controller = new AuthController(authService.Object, new Mock<AMS.Application.Contracts.IUserAppService>().Object, CreateTestConfiguration());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, "Student")
                }, "Test"))
            }
        };

        var request = new UpdateProfileRequest { FullName = updatedUser.FullName, ParentMobile = updatedUser.ParentMobile };
        var result = await controller.UpdateProfile(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedUser = Assert.IsType<UserDto>(okResult.Value);
        Assert.Equal(updatedUser.FullName, returnedUser.FullName);
        Assert.Equal(updatedUser.ParentMobile, returnedUser.ParentMobile);
    }

    [Fact]
    public async Task ChangePassword_Should_Return_NoContent_When_Successful()
    {
        var userId = Guid.NewGuid();
        var authService = new Mock<AMS.Application.Contracts.IAuthAppService>();
        authService.Setup(s => s.ChangePasswordAsync(userId, "current", "newpass", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask)
            .Verifiable();

        var controller = new AuthController(authService.Object, new Mock<AMS.Application.Contracts.IUserAppService>().Object, CreateTestConfiguration());
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                    new Claim(ClaimTypes.Role, "Student")
                }, "Test"))
            }
        };

        var result = await controller.ChangePassword(new ChangePasswordRequest { CurrentPassword = "current", NewPassword = "newpass" });

        Assert.IsType<NoContentResult>(result);
        authService.Verify();
    }

    private static IConfiguration CreateTestConfiguration()
    {
        return new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestJwtKey1234567890TestJwtKey1234567890",
            ["Jwt:Issuer"] = "test-issuer",
            ["Jwt:Audience"] = "test-audience",
            ["Jwt:AccessTokenExpiresMinutes"] = "15",
            ["Jwt:RefreshTokenExpiresMinutes"] = "21600"
        }).Build();
    }
}

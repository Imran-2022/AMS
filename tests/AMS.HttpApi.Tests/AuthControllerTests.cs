using AMS.Application.Contracts.Dtos;
using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_Should_Return_Unauthorized_For_Invalid_Credentials()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "TestJwtKey1234567890",
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
            ["Jwt:Key"] = "TestJwtKey1234567890",
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
}

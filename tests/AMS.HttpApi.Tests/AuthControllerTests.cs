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
            ["Jwt:ExpiresMinutes"] = "60"
        }).Build();

        var controller = new AuthController(new FakeAuthAppService(), configuration);

        var result = await controller.Login(new LoginRequest { Email = "x", Password = "y" });

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    private class FakeAuthAppService : AMS.Application.Contracts.IAuthAppService
    {
        public Task<AMS.Application.Contracts.Dtos.UserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
            => Task.FromResult<AMS.Application.Contracts.Dtos.UserDto?>(null);

        public Task<AMS.Application.Contracts.Dtos.UserDto> UpdateProfileAsync(Guid userId, string fullName, string parentMobile, CancellationToken cancellationToken = default)
            => Task.FromResult(new AMS.Application.Contracts.Dtos.UserDto { Id = userId, FullName = fullName, ParentMobile = parentMobile });

        public Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}

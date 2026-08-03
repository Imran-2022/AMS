using AMS.HttpApi.Controllers;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace AMS.HttpApi.Tests;

public class AuthControllerTests
{
    [Fact]
    public async Task Login_Should_Return_Unauthorized_For_Invalid_Credentials()
    {
        var controller = new AuthController(new FakeAuthAppService());

        var result = await controller.Login(new LoginRequest { Email = "x", Password = "y" });

        Assert.IsType<UnauthorizedResult>(result.Result);
    }

    private class FakeAuthAppService : AMS.Application.Contracts.IAuthAppService
    {
        public Task<AMS.Application.Contracts.Dtos.UserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default)
            => Task.FromResult<AMS.Application.Contracts.Dtos.UserDto?>(null);
    }
}

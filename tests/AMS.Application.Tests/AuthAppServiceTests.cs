using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Xunit;

namespace AMS.Application.Tests;

public class AuthAppServiceTests
{
    [Fact]
    public async Task LoginAsync_Should_Return_Null_For_Invalid_Credentials()
    {
        var repo = new FakeUserRepository();
        var service = new AuthAppService(repo);

        var result = await service.LoginAsync("unknown@example.com", "wrong");

        Assert.Null(result);
    }

    private class FakeUserRepository : IUserRepository
    {
        public Task AddAsync(AppUser user, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<IReadOnlyList<AppUser>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<AppUser>>(Array.Empty<AppUser>());
        public Task<AppUser?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) => Task.FromResult<AppUser?>(null);
        public Task<AppUser?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<AppUser?>(null);
        public Task UpdateAsync(AppUser user, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}

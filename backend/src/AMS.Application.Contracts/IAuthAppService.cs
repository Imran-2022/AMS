using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IAuthAppService
{
    Task<UserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
}

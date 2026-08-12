using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IAuthAppService
{
    Task<UserDto?> LoginAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateProfileAsync(Guid userId, string fullName, string parentMobile, CancellationToken cancellationToken = default);
    Task ChangePasswordAsync(Guid userId, string currentPassword, string newPassword, CancellationToken cancellationToken = default);
}

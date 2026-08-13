using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IUserAppService
{
    Task<IReadOnlyList<UserDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<UserDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<UserDto> CreateAsync(CreateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<UserDto> ToggleActiveAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<string> GetNextStudentIdAsync(Guid classCourseId, Guid? groupId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

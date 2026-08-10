using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IAssignmentAppService
{
    Task<IReadOnlyList<AssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto> CreateAsync(CreateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto> UpdateAsync(Guid id, UpdateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto> DuplicateAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto> PublishAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<AssignmentDto> UnpublishAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

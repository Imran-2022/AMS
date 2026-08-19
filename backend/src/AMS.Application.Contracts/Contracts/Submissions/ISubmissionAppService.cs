using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface ISubmissionAppService
{
    Task<IReadOnlyList<SubmissionDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SubmissionDto>> GetMineAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubmissionDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubmissionDto> CreateAsync(CreateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubmissionDto> UpdateAsync(Guid id, UpdateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubmissionDto> GradeAsync(Guid id, GradeSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubmissionDto> UpdateStatusAsync(Guid id, UpdateSubmissionStatusDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

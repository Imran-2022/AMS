using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface ISubjectAppService
{
    Task<IReadOnlyList<SubjectDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default);
    Task<SubjectDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubjectDto> CreateAsync(CreateSubjectDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<SubjectDto> UpdateAsync(Guid id, UpdateSubjectDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

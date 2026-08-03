using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IAssignmentRepository
{
    Task<Assignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Assignment>> GetByTeacherAsync(Guid teacherId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Assignment>> GetPublishedForClassAsync(Guid classCourseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Assignment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Assignment assignment, CancellationToken cancellationToken = default);
    Task UpdateAsync(Assignment assignment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

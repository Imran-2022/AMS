using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface ISubmissionRepository
{
    Task<Submission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Submission?> GetByAssignmentAndStudentAsync(Guid assignmentId, Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Submission>> GetByAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Submission>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task AddAsync(Submission submission, CancellationToken cancellationToken = default);
    Task UpdateAsync(Submission submission, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

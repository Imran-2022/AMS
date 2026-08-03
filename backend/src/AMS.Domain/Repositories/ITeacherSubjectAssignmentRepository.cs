using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface ITeacherSubjectAssignmentRepository
{
    Task<TeacherSubjectAssignment?> GetAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TeacherSubjectAssignment>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TeacherSubjectAssignment>> GetByTeacherAsync(Guid teacherId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TeacherSubjectAssignment>> GetBySubjectAsync(Guid subjectId, CancellationToken cancellationToken = default);
    Task AddAsync(TeacherSubjectAssignment assignment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default);
}

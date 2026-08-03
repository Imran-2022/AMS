using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IStudentEnrollmentRepository
{
    Task<StudentEnrollment?> GetAsync(Guid studentId, Guid classCourseId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentEnrollment>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<StudentEnrollment>> GetByClassCourseAsync(Guid classCourseId, CancellationToken cancellationToken = default);
    Task AddAsync(StudentEnrollment enrollment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid studentId, Guid classCourseId, CancellationToken cancellationToken = default);
}

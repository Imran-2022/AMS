using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IClassCourseRepository
{
    Task<ClassCourse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassCourse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassCourse>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken cancellationToken = default);
    Task AddAsync(ClassCourse classCourse, CancellationToken cancellationToken = default);
    Task UpdateAsync(ClassCourse classCourse, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

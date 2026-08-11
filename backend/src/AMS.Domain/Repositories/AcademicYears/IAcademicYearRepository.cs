using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IAcademicYearRepository
{
    Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<AcademicYear?> GetActiveAsync(CancellationToken cancellationToken = default);
    Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default);
    Task UpdateAsync(AcademicYear academicYear, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

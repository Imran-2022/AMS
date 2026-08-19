using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class StudentEnrollmentRepository : IStudentEnrollmentRepository
{
    private readonly AmsDbContext _dbContext;

    public StudentEnrollmentRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<StudentEnrollment?> GetAsync(Guid studentId, Guid classCourseId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.FirstOrDefaultAsync(x => x.StudentId == studentId && x.ClassCourseId == classCourseId, cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.StudentId == studentId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.StudentId == studentId && x.AcademicYearId == academicYearId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetActiveByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.StudentId == studentId && x.IsActive).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetActiveByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.StudentId == studentId && x.AcademicYearId == academicYearId && x.IsActive).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetByClassCourseAsync(Guid classCourseId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.ClassCourseId == classCourseId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<StudentEnrollment>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken cancellationToken = default)
        => await _dbContext.StudentEnrollments.Where(x => x.AcademicYearId == academicYearId).ToListAsync(cancellationToken);

    public async Task AddAsync(StudentEnrollment enrollment, CancellationToken cancellationToken = default)
    {
        await _dbContext.StudentEnrollments.AddAsync(enrollment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(StudentEnrollment enrollment, CancellationToken cancellationToken = default)
    {
        _dbContext.StudentEnrollments.Update(enrollment);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid studentId, Guid classCourseId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.StudentEnrollments.FirstOrDefaultAsync(x => x.StudentId == studentId && x.ClassCourseId == classCourseId, cancellationToken);
        if (entity is not null)
        {
            _dbContext.StudentEnrollments.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

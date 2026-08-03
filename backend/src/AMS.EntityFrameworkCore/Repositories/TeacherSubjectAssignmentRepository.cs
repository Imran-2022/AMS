using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class TeacherSubjectAssignmentRepository : ITeacherSubjectAssignmentRepository
{
    private readonly AmsDbContext _dbContext;

    public TeacherSubjectAssignmentRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<TeacherSubjectAssignment?> GetAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default)
        => await _dbContext.TeacherSubjectAssignments.FirstOrDefaultAsync(x => x.TeacherId == teacherId && x.SubjectId == subjectId, cancellationToken);

    public async Task<IReadOnlyList<TeacherSubjectAssignment>> GetByTeacherAsync(Guid teacherId, CancellationToken cancellationToken = default)
        => await _dbContext.TeacherSubjectAssignments.Where(x => x.TeacherId == teacherId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<TeacherSubjectAssignment>> GetBySubjectAsync(Guid subjectId, CancellationToken cancellationToken = default)
        => await _dbContext.TeacherSubjectAssignments.Where(x => x.SubjectId == subjectId).ToListAsync(cancellationToken);

    public async Task AddAsync(TeacherSubjectAssignment assignment, CancellationToken cancellationToken = default)
    {
        await _dbContext.TeacherSubjectAssignments.AddAsync(assignment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid teacherId, Guid subjectId, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.TeacherSubjectAssignments.FirstOrDefaultAsync(x => x.TeacherId == teacherId && x.SubjectId == subjectId, cancellationToken);
        if (entity is not null)
        {
            _dbContext.TeacherSubjectAssignments.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

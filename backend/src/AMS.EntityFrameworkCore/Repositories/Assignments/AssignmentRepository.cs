using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class AssignmentRepository : IAssignmentRepository
{
    private readonly AmsDbContext _dbContext;

    public AssignmentRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Assignment?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.Assignments.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Assignment>> GetByTeacherAsync(Guid teacherId, CancellationToken cancellationToken = default)
        => await _dbContext.Assignments.Where(x => x.TeacherId == teacherId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Assignment>> GetPublishedForClassAsync(Guid classCourseId, CancellationToken cancellationToken = default)
        => await _dbContext.Assignments
            .Join(_dbContext.Subjects,
                assignment => assignment.SubjectId,
                subject => subject.Id,
                (assignment, subject) => new { assignment, subject })
            .Where(x => x.assignment.Status == AMS.Domain.Shared.AssignmentStatus.Published && x.subject.ClassCourseId == classCourseId)
            .Select(x => x.assignment)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Assignment>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.Assignments.ToListAsync(cancellationToken);

    public async Task AddAsync(Assignment assignment, CancellationToken cancellationToken = default)
    {
        await _dbContext.Assignments.AddAsync(assignment, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Assignment assignment, CancellationToken cancellationToken = default)
    {
        _dbContext.Assignments.Update(assignment);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Assignments.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.Assignments.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

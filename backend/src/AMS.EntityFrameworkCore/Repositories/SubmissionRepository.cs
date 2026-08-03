using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class SubmissionRepository : ISubmissionRepository
{
    private readonly AmsDbContext _dbContext;

    public SubmissionRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Submission?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.Submissions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<Submission?> GetByAssignmentAndStudentAsync(Guid assignmentId, Guid studentId, CancellationToken cancellationToken = default)
        => await _dbContext.Submissions.FirstOrDefaultAsync(x => x.AssignmentId == assignmentId && x.StudentId == studentId, cancellationToken);

    public async Task<IReadOnlyList<Submission>> GetByAssignmentAsync(Guid assignmentId, CancellationToken cancellationToken = default)
        => await _dbContext.Submissions.Where(x => x.AssignmentId == assignmentId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Submission>> GetByStudentAsync(Guid studentId, CancellationToken cancellationToken = default)
        => await _dbContext.Submissions.Where(x => x.StudentId == studentId).ToListAsync(cancellationToken);

    public async Task AddAsync(Submission submission, CancellationToken cancellationToken = default)
    {
        await _dbContext.Submissions.AddAsync(submission, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Submission submission, CancellationToken cancellationToken = default)
    {
        _dbContext.Submissions.Update(submission);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Submissions.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.Submissions.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

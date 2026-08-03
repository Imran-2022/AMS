using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class SubjectRepository : ISubjectRepository
{
    private readonly AmsDbContext _dbContext;

    public SubjectRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.Subjects.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Subject>> GetByClassCourseIdAsync(Guid classCourseId, CancellationToken cancellationToken = default)
        => await _dbContext.Subjects.Where(x => x.ClassCourseId == classCourseId).ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Subject>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.Subjects.ToListAsync(cancellationToken);

    public async Task AddAsync(Subject subject, CancellationToken cancellationToken = default)
    {
        await _dbContext.Subjects.AddAsync(subject, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(Subject subject, CancellationToken cancellationToken = default)
    {
        _dbContext.Subjects.Update(subject);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Subjects.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.Subjects.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

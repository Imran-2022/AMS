using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class ClassCourseRepository : IClassCourseRepository
{
    private readonly AmsDbContext _dbContext;

    public ClassCourseRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ClassCourse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.ClassCourses.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<IReadOnlyList<ClassCourse>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.ClassCourses.ToListAsync(cancellationToken);

    public async Task AddAsync(ClassCourse classCourse, CancellationToken cancellationToken = default)
    {
        await _dbContext.ClassCourses.AddAsync(classCourse, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(ClassCourse classCourse, CancellationToken cancellationToken = default)
    {
        _dbContext.ClassCourses.Update(classCourse);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.ClassCourses.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.ClassCourses.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

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
    {
        try
        {
            return await _dbContext.ClassCourses.ToListAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // If the database schema hasn't been migrated yet the EF mapped query
            // may reference columns that don't exist (e.g. class_definition_id).
            // Fall back to a safe raw SQL read of the base columns so seeding
            // and other startup activities can proceed.
            var message = ex.Message ?? string.Empty;
            if (message.Contains("class_definition_id") || message.Contains("group_id") || message.Contains("does not exist"))
            {
                var results = new List<ClassCourse>();
                var conn = _dbContext.Database.GetDbConnection();
                if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync(cancellationToken);
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT \"Id\", \"name\", \"section\", \"academic_year\" FROM class_courses";
                    await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);
                    while (await reader.ReadAsync(cancellationToken))
                    {
                        var id = reader.GetFieldValue<Guid>(0);
                        var name = reader.IsDBNull(1) ? string.Empty : reader.GetString(1);
                        var section = reader.IsDBNull(2) ? string.Empty : reader.GetString(2);
                        var academicYear = reader.IsDBNull(3) ? string.Empty : reader.GetString(3);
                        results.Add(new ClassCourse(id, name, section, academicYear));
                    }
                }

                return results;
            }

            throw;
        }
    }

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

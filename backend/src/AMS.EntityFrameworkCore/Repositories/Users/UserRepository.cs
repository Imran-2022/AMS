using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AmsDbContext _dbContext;

    public UserRepository(AmsDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
        => await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public async Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default)
        => await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

    public async Task<IReadOnlyList<User>> GetAllAsync(CancellationToken cancellationToken = default)
        => await _dbContext.Users
            .Include(u => u.StudentProfile)
            .Include(u => u.TeacherProfile)
            .ToListAsync(cancellationToken);

    public async Task AddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _dbContext.Users.AddAsync(user, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task UpdateAsync(User user, CancellationToken cancellationToken = default)
    {
        var existing = await _dbContext.Users
            .Include(u => u.TeacherProfile)
            .Include(u => u.StudentProfile)
            .FirstOrDefaultAsync(x => x.Id == user.Id, cancellationToken);

        if (existing is null)
        {
            _dbContext.Users.Attach(user);
            _dbContext.Entry(user).State = EntityState.Modified;
            if (user.TeacherProfile is not null) _dbContext.Entry(user.TeacherProfile).State = EntityState.Modified;
            if (user.StudentProfile is not null) _dbContext.Entry(user.StudentProfile).State = EntityState.Modified;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return;
        }

        if (!ReferenceEquals(existing, user))
        {
            _dbContext.Entry(existing).State = EntityState.Detached;
        }

        _dbContext.Attach(user);
        _dbContext.Entry(user).State = EntityState.Modified;

        if (user.TeacherProfile is not null)
        {
            var teacherProfile = await _dbContext.TeacherProfiles
                .FirstOrDefaultAsync(tp => tp.UserId == user.Id, cancellationToken);

            if (teacherProfile is null)
            {
                _dbContext.TeacherProfiles.Add(user.TeacherProfile);
            }
            else
            {
                _dbContext.Entry(teacherProfile).CurrentValues.SetValues(user.TeacherProfile);
                _dbContext.Entry(teacherProfile).State = EntityState.Modified;
            }
        }

        if (user.StudentProfile is not null)
        {
            var studentProfile = await _dbContext.StudentProfiles
                .FirstOrDefaultAsync(sp => sp.UserId == user.Id, cancellationToken);

            if (studentProfile is null)
            {
                _dbContext.StudentProfiles.Add(user.StudentProfile);
            }
            else
            {
                _dbContext.Entry(studentProfile).CurrentValues.SetValues(user.StudentProfile);
                _dbContext.Entry(studentProfile).State = EntityState.Modified;
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await _dbContext.Users.FindAsync(new object[] { id }, cancellationToken);
        if (entity is not null)
        {
            _dbContext.Users.Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}

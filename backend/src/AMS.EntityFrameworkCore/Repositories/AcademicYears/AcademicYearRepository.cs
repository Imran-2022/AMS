using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class AcademicYearRepository : IAcademicYearRepository
{
    private readonly AmsDbContext _context;

    public AcademicYearRepository(AmsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(AcademicYear academicYear, CancellationToken cancellationToken = default)
    {
        if (academicYear.IsActive)
        {
            var otherActiveYears = await _context.AcademicYears
                .Where(x => x.Id != academicYear.Id && x.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var year in otherActiveYears)
            {
                year.Deactivate();
            }
        }

        await _context.AcademicYears.AddAsync(academicYear, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity is null) return;

        _context.AcademicYears.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AcademicYear>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AcademicYears.OrderByDescending(x => x.Name).ToListAsync(cancellationToken);
    }

    public async Task<AcademicYear?> GetActiveAsync(CancellationToken cancellationToken = default)
    {
        return await _context.AcademicYears.FirstOrDefaultAsync(x => x.IsActive, cancellationToken);
    }

    public async Task<AcademicYear?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.AcademicYears.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(AcademicYear academicYear, CancellationToken cancellationToken = default)
    {
        // If activating this year, deactivate all others
        if (academicYear.IsActive)
        {
            var otherActiveYears = await _context.AcademicYears
                .Where(x => x.Id != academicYear.Id && x.IsActive)
                .ToListAsync(cancellationToken);

            foreach (var year in otherActiveYears)
            {
                year.Deactivate();
            }
        }

        _context.AcademicYears.Update(academicYear);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

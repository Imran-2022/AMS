using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore.Repositories;

public class ClassDefinitionRepository : IClassDefinitionRepository
{
    private readonly AmsDbContext _context;

    public ClassDefinitionRepository(AmsDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default)
    {
        await _context.ClassDefinitions.AddAsync(classDefinition, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await GetByIdAsync(id, cancellationToken);
        if (entity is null) return;

        _context.ClassDefinitions.Remove(entity);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<ClassDefinition>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await _context.ClassDefinitions
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<ClassDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.ClassDefinitions.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task UpdateAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default)
    {
        _context.ClassDefinitions.Update(classDefinition);
        await _context.SaveChangesAsync(cancellationToken);
    }
}

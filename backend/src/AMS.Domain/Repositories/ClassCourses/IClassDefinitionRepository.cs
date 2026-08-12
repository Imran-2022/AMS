using AMS.Domain.Entities;

namespace AMS.Domain.Repositories;

public interface IClassDefinitionRepository
{
    Task<ClassDefinition?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ClassDefinition>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default);
    Task UpdateAsync(ClassDefinition classDefinition, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IClassCourseAppService
{
    Task<IReadOnlyList<ClassCourseDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<ClassCourseDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<ClassCourseDto> CreateAsync(CreateClassCourseDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<ClassCourseDto> UpdateAsync(Guid id, UpdateClassCourseDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

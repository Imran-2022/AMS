using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface IEnrollmentAppService
{
    Task<IReadOnlyList<StudentEnrollmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<StudentEnrollmentDto> CreateAsync(CreateStudentEnrollmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid studentId, Guid classCourseId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}

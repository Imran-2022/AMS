using AMS.Application.Contracts.Dtos;

namespace AMS.Application.Contracts;

public interface ITeacherSubjectAssignmentAppService
{
    Task<IReadOnlyList<TeacherSubjectAssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task<TeacherSubjectAssignmentDto> CreateAsync(CreateTeacherSubjectAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid teacherId, Guid subjectId, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default);
}
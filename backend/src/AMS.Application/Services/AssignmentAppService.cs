using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class AssignmentAppService : IAssignmentAppService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherAssignmentRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;
    private readonly IUserRepository _userRepository;

    public AssignmentAppService(
        IAssignmentRepository assignmentRepository,
        ITeacherSubjectAssignmentRepository teacherAssignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        IUserRepository userRepository)
    {
        _assignmentRepository = assignmentRepository;
        _teacherAssignmentRepository = teacherAssignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _userRepository = userRepository;
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignments = await _assignmentRepository.GetAllAsync(cancellationToken);
        if (currentUserRole == nameof(UserRole.Admin)) return assignments.Select(ToDto).ToList();
        if (currentUserRole == nameof(UserRole.Teacher)) return assignments.Where(x => x.TeacherId == currentUserId).Select(ToDto).ToList();
        return assignments.Where(x => x.Status == AssignmentStatus.Published && IsEnrolled(currentUserId, x.ClassCourseId)).Select(ToDto).ToList();
    }

    public async Task<AssignmentDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken);
        if (assignment is null) return null;

        if (currentUserRole == nameof(UserRole.Admin)) return ToDto(assignment);
        if (currentUserRole == nameof(UserRole.Teacher) && assignment.TeacherId == currentUserId) return ToDto(assignment);
        if (assignment.Status == AssignmentStatus.Published && IsEnrolled(currentUserId, assignment.ClassCourseId)) return ToDto(assignment);
        throw new ForbiddenException("You cannot access this assignment.");
    }

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin) && currentUserRole != nameof(UserRole.Teacher)) throw new ForbiddenException("Only teachers and admins can create assignments.");

        var assignment = new Assignment(Guid.NewGuid(), input.Title, input.Description, input.ClassCourseId, input.SubjectId, currentUserId, input.Deadline, input.MaxMarks, AssignmentStatus.Draft, input.AllowLateSubmission, input.AllowResubmission, DateTime.UtcNow);
        await _assignmentRepository.AddAsync(assignment, cancellationToken);
        return ToDto(assignment);
    }

    public async Task<AssignmentDto> UpdateAsync(Guid id, UpdateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);

        if (input.Title is not null) assignment = new Assignment(assignment.Id, input.Title, assignment.Description, assignment.ClassCourseId, assignment.SubjectId, assignment.TeacherId, assignment.Deadline, assignment.MaxMarks, assignment.Status, assignment.AllowLateSubmission, assignment.AllowResubmission, assignment.CreatedAt);
        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);
        return ToDto(assignment);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);
        await _assignmentRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<AssignmentDto> PublishAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);
        assignment.Publish();
        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);
        return ToDto(assignment);
    }

    private void EnsureCanManage(Assignment assignment, Guid currentUserId, string currentUserRole)
    {
        if (currentUserRole == nameof(UserRole.Admin)) return;
        if (currentUserRole == nameof(UserRole.Teacher) && assignment.TeacherId == currentUserId) return;
        throw new ForbiddenException("You are not allowed to manage this assignment.");
    }

    private bool IsEnrolled(Guid studentId, Guid classCourseId)
    {
        return _studentEnrollmentRepository.GetByStudentAsync(studentId).GetAwaiter().GetResult().Any(x => x.ClassCourseId == classCourseId);
    }

    private static AssignmentDto ToDto(Assignment assignment) => new()
    {
        Id = assignment.Id,
        Title = assignment.Title,
        Description = assignment.Description,
        ClassCourseId = assignment.ClassCourseId,
        SubjectId = assignment.SubjectId,
        TeacherId = assignment.TeacherId,
        Deadline = assignment.Deadline,
        MaxMarks = assignment.MaxMarks,
        Status = assignment.Status.ToString(),
        AllowLateSubmission = assignment.AllowLateSubmission,
        AllowResubmission = assignment.AllowResubmission,
        CreatedAt = assignment.CreatedAt
    };
}

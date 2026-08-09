using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class AssignmentAppService : IAssignmentAppService
{
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherSubjectAssignmentRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly ISubjectRepository _subjectRepository;

    public AssignmentAppService(
        IAssignmentRepository assignmentRepository,
        ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        ISubmissionRepository submissionRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        ISubjectRepository subjectRepository)
    {
        _assignmentRepository = assignmentRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _submissionRepository = submissionRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _subjectRepository = subjectRepository;
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignments = await _assignmentRepository.GetAllAsync(cancellationToken);
        if (currentUserRole == nameof(UserRole.Admin))
        {
            var results = new List<AssignmentDto>(assignments.Count);
            foreach (var assignment in assignments)
            {
                results.Add(await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false));
            }
            return results;
        }

        if (currentUserRole == nameof(UserRole.Teacher))
        {
            assignments = assignments.Where(x => x.TeacherId == currentUserId).ToList();
            var results = new List<AssignmentDto>(assignments.Count);
            foreach (var assignment in assignments)
            {
                results.Add(await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false));
            }
            return results;
        }

        var enrolledClassIds = await _studentEnrollmentRepository.GetByStudentAsync(currentUserId, cancellationToken);
        var enrolledIds = enrolledClassIds.Select(x => x.ClassCourseId).ToHashSet();
        assignments = assignments.Where(x => x.Status == AssignmentStatus.Published && enrolledIds.Contains(x.ClassCourseId)).ToList();
        var studentResults = new List<AssignmentDto>(assignments.Count);
        foreach (var assignment in assignments)
        {
            studentResults.Add(await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false));
        }
        return studentResults;
    }

    public async Task<AssignmentDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken);
        if (assignment is null) return null;

        if (currentUserRole == nameof(UserRole.Admin) || (currentUserRole == nameof(UserRole.Teacher) && assignment.TeacherId == currentUserId))
        {
            return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
        }

        var isEnrolled = await IsEnrolled(currentUserId, assignment.ClassCourseId, cancellationToken);
        if (assignment.Status == AssignmentStatus.Published && isEnrolled) return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
        throw new ForbiddenException("You cannot access this assignment.");
    }

    public async Task<AssignmentDto> CreateAsync(CreateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Admin) && currentUserRole != nameof(UserRole.Teacher)) throw new ForbiddenException("Only teachers and admins can create assignments.");

        var teacherId = currentUserId;
        if (currentUserRole == nameof(UserRole.Admin) && input.TeacherId is not null)
        {
            var teacher = await _userRepository.GetByIdAsync(input.TeacherId.Value, cancellationToken);
            if (teacher is null) throw new NotFoundException("Teacher not found.");
            if (teacher.Role != UserRole.Teacher) throw new ValidationException("Selected user is not a teacher.");
            teacherId = teacher.Id;
        }

        if (currentUserRole == nameof(UserRole.Teacher) || (currentUserRole == nameof(UserRole.Admin) && input.TeacherId is not null))
        {
            var teacherAssignment = await _teacherSubjectAssignmentRepository.GetAsync(teacherId, input.SubjectId, cancellationToken);
            if (teacherAssignment is null) throw new ForbiddenException("Teacher is not assigned to this subject.");
        }

        DateTime NormalizeToUtc(DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc) return dt;
            if (dt.Kind == DateTimeKind.Unspecified) return DateTime.SpecifyKind(dt, DateTimeKind.Local).ToUniversalTime();
            return dt.ToUniversalTime();
        }

        var deadlineUtc = NormalizeToUtc(input.Deadline);

        var assignment = new Assignment(Guid.NewGuid(), input.Title, input.Description, input.ClassCourseId, input.SubjectId, teacherId, deadlineUtc, input.MaxMarks, AssignmentStatus.Draft, input.AllowLateSubmission, input.AllowResubmission, DateTime.UtcNow, input.AttachmentUrl, input.AttachmentName);
        await _assignmentRepository.AddAsync(assignment, cancellationToken);
        return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AssignmentDto> UpdateAsync(Guid id, UpdateAssignmentDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);

        DateTime? NormalizeToUtcNullable(DateTime? dt)
        {
            if (!dt.HasValue) return null;
            var v = dt.Value;
            if (v.Kind == DateTimeKind.Utc) return v;
            if (v.Kind == DateTimeKind.Unspecified) return DateTime.SpecifyKind(v, DateTimeKind.Local).ToUniversalTime();
            return v.ToUniversalTime();
        }

        var newDeadline = NormalizeToUtcNullable(input.Deadline) ?? assignment.Deadline;

        assignment = new Assignment(
            assignment.Id,
            input.Title ?? assignment.Title,
            input.Description ?? assignment.Description,
            input.ClassCourseId ?? assignment.ClassCourseId,
            input.SubjectId ?? assignment.SubjectId,
            assignment.TeacherId,
            newDeadline,
            input.MaxMarks ?? assignment.MaxMarks,
            assignment.Status,
            input.AllowLateSubmission ?? assignment.AllowLateSubmission,
            input.AllowResubmission ?? assignment.AllowResubmission,
            assignment.CreatedAt,
            input.AttachmentUrl ?? assignment.AttachmentUrl,
            input.AttachmentName ?? assignment.AttachmentName);

        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);
        return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
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
        return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AssignmentDto> UnpublishAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);
        assignment.Unpublish();
        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);
        return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
    }

    private void EnsureCanManage(Assignment assignment, Guid currentUserId, string currentUserRole)
    {
        if (currentUserRole == nameof(UserRole.Admin)) return;
        if (currentUserRole == nameof(UserRole.Teacher) && assignment.TeacherId == currentUserId) return;
        throw new ForbiddenException("You are not allowed to manage this assignment.");
    }

    private async Task<bool> IsEnrolled(Guid studentId, Guid classCourseId, CancellationToken cancellationToken = default)
    {
        var enrollments = await _studentEnrollmentRepository.GetByStudentAsync(studentId, cancellationToken);
        return enrollments.Any(x => x.ClassCourseId == classCourseId);
    }

    private async Task<AssignmentDto> ToDtoAsync(Assignment assignment, CancellationToken cancellationToken = default)
    {
        var classCourse = await _classCourseRepository.GetByIdAsync(assignment.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");
        var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");

        var submissions = await _submissionRepository.GetByAssignmentAsync(assignment.Id, cancellationToken).ConfigureAwait(false);
        var enrollments = await _studentEnrollmentRepository.GetByClassCourseAsync(assignment.ClassCourseId, cancellationToken).ConfigureAwait(false);

        return new AssignmentDto
        {
            Id = assignment.Id,
            Title = assignment.Title,
            Description = assignment.Description,
            AttachmentUrl = assignment.AttachmentUrl,
            AttachmentName = assignment.AttachmentName,
            ClassCourseId = assignment.ClassCourseId,
            SubjectId = assignment.SubjectId,
            TeacherId = assignment.TeacherId,
            Deadline = assignment.Deadline,
            MaxMarks = assignment.MaxMarks,
            Status = assignment.Status.ToString(),
            AllowLateSubmission = assignment.AllowLateSubmission,
            AllowResubmission = assignment.AllowResubmission,
            CreatedAt = assignment.CreatedAt,
            ClassCourseName = classCourse.Name,
            ClassCourseSection = classCourse.Section,
            SubjectName = subject.Name,
            SubmittedCount = submissions.Count,
            TotalStudents = enrollments.Count
        };
    }
}

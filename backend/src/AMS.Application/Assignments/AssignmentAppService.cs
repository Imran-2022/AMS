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
    private readonly IGroupRepository _groupRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IAttachmentAppService _attachmentAppService;
    private readonly INotificationService _notificationService;
    private readonly IAcademicYearRepository _academicYearRepository;

    public AssignmentAppService(
        IAssignmentRepository assignmentRepository,
        ITeacherSubjectAssignmentRepository teacherSubjectAssignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        ISubmissionRepository submissionRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        IGroupRepository groupRepository,
        ISubjectRepository subjectRepository,
        IAttachmentAppService attachmentAppService,
        INotificationService notificationService,
        IAcademicYearRepository academicYearRepository)
    {
        _assignmentRepository = assignmentRepository;
        _teacherSubjectAssignmentRepository = teacherSubjectAssignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _submissionRepository = submissionRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _groupRepository = groupRepository;
        _subjectRepository = subjectRepository;
        _attachmentAppService = attachmentAppService;
        _notificationService = notificationService;
        _academicYearRepository = academicYearRepository;
    }

    public async Task<IReadOnlyList<AssignmentDto>> GetAllAsync(Guid currentUserId, string currentUserRole, bool includeAllAcademicYears = false, CancellationToken cancellationToken = default)
    {
        var allAssignments = await _assignmentRepository.GetAllAsync(cancellationToken);
        var activeYear = await _academicYearRepository.GetActiveAsync(cancellationToken);

        var visibleAssignments = new List<Assignment>();
        foreach (var assignment in allAssignments)
        {
            var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken);
            if (subject is null) continue;

            var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId, cancellationToken);
            if (classCourse is null) continue;

            if (includeAllAcademicYears || activeYear is null || classCourse.AcademicYearId == activeYear.Id)
            {
                visibleAssignments.Add(assignment);
            }
        }

        if (currentUserRole == nameof(UserRole.Admin))
        {
            var results = new List<AssignmentDto>(visibleAssignments.Count);
            foreach (var assignment in visibleAssignments)
            {
                results.Add(await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false));
            }
            return results;
        }

        if (currentUserRole == nameof(UserRole.Teacher))
        {
            visibleAssignments = visibleAssignments.Where(x => x.TeacherId == currentUserId).ToList();
            var results = new List<AssignmentDto>(visibleAssignments.Count);
            foreach (var assignment in visibleAssignments)
            {
                results.Add(await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false));
            }
            return results;
        }

        var enrolledClassIds = await _studentEnrollmentRepository.GetByStudentAsync(currentUserId, cancellationToken);
        var enrolledIds = enrolledClassIds.Select(x => x.ClassCourseId).ToHashSet();

        var studentAssignments = new List<Assignment>();
        foreach (var assignment in visibleAssignments)
        {
            if (assignment.Status != AssignmentStatus.Published) continue;
            var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken);
            if (subject is null) continue;
            if (enrolledIds.Contains(subject.ClassCourseId)) studentAssignments.Add(assignment);
        }

        var studentResults = new List<AssignmentDto>(studentAssignments.Count);
        foreach (var assignment in studentAssignments)
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

        var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        var isEnrolled = await IsEnrolled(currentUserId, subject.ClassCourseId, cancellationToken);
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

        var subject = await _subjectRepository.GetByIdAsync(input.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        if (input.ClassCourseId != Guid.Empty && input.ClassCourseId != subject.ClassCourseId)
        {
            throw new ValidationException("Selected class course does not match the chosen subject.");
        }

        DateTime NormalizeToUtc(DateTime dt)
        {
            if (dt.Kind == DateTimeKind.Utc) return dt;
            if (dt.Kind == DateTimeKind.Unspecified) return DateTime.SpecifyKind(dt, DateTimeKind.Local).ToUniversalTime();
            return dt.ToUniversalTime();
        }

        var deadlineUtc = NormalizeToUtc(input.Deadline);

        var assignment = new Assignment(Guid.NewGuid(), input.Title, input.Description, input.SubjectId, teacherId, deadlineUtc, input.MaxMarks, AssignmentStatus.Draft, input.AllowLateSubmission, input.AllowResubmission, DateTime.UtcNow);
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

        var subjectId = input.SubjectId ?? assignment.SubjectId;
        var subject = await _subjectRepository.GetByIdAsync(subjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        if (input.ClassCourseId.HasValue && input.ClassCourseId.Value != subject.ClassCourseId)
        {
            throw new ValidationException("Selected class course does not match the chosen subject.");
        }

        var newDeadline = NormalizeToUtcNullable(input.Deadline) ?? assignment.Deadline;

        assignment.UpdateDetails(
            input.Title ?? assignment.Title,
            input.Description ?? assignment.Description,
            subjectId,
            newDeadline,
            input.MaxMarks ?? assignment.MaxMarks,
            input.AllowLateSubmission ?? assignment.AllowLateSubmission,
            input.AllowResubmission ?? assignment.AllowResubmission);

        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);
        return await ToDtoAsync(assignment, cancellationToken).ConfigureAwait(false);
    }

    public async Task<AssignmentDto> DuplicateAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var existingAssignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(existingAssignment, currentUserId, currentUserRole);

        var duplicateAssignment = new Assignment(
            Guid.NewGuid(),
            existingAssignment.Title + " (Copy)",
            existingAssignment.Description,
            existingAssignment.SubjectId,
            existingAssignment.TeacherId,
            existingAssignment.Deadline,
            existingAssignment.MaxMarks,
            AssignmentStatus.Draft,
            existingAssignment.AllowLateSubmission,
            existingAssignment.AllowResubmission,
            DateTime.UtcNow);

        await _assignmentRepository.AddAsync(duplicateAssignment, cancellationToken);
        await _attachmentAppService.CloneAttachmentsAsync("Assignment", existingAssignment.Id, "Assignment", duplicateAssignment.Id);

        return await ToDtoAsync(duplicateAssignment, cancellationToken).ConfigureAwait(false);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);
        await _attachmentAppService.DeleteByOwnerAsync("Assignment", id);
        await _assignmentRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<AssignmentDto> PublishAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        EnsureCanManage(assignment, currentUserId, currentUserRole);
        assignment.Publish();
        await _assignmentRepository.UpdateAsync(assignment, cancellationToken);

        // Notifications must be created before the request completes.
        // Fire-and-forget background tasks were being discarded when the request scope ended,
        // which left the notification tables empty even though the action succeeded.
        await _notificationService.NotifyAssignmentPublishedAsync(assignment, cancellationToken);

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
        var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId, cancellationToken) ?? throw new NotFoundException("Subject not found.");
        var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");
        var group = classCourse.GroupId.HasValue ? await _groupRepository.GetByIdAsync(classCourse.GroupId.Value, cancellationToken) : null;
        var teacher = await _userRepository.GetByIdAsync(assignment.TeacherId, cancellationToken);

        var submissions = await _submissionRepository.GetByAssignmentAsync(assignment.Id, cancellationToken).ConfigureAwait(false);
        var enrollments = await _studentEnrollmentRepository.GetByClassCourseAsync(subject.ClassCourseId, cancellationToken).ConfigureAwait(false);

        var attachments = await _attachmentAppService.ListAsync("Assignment", assignment.Id);

        return new AssignmentDto
        {
            Id = assignment.Id,
            Title = assignment.Title,
            Description = assignment.Description,
            ClassCourseId = subject.ClassCourseId,
            SubjectId = assignment.SubjectId,
            TeacherId = assignment.TeacherId,
            Deadline = assignment.Deadline,
            MaxMarks = assignment.MaxMarks,
            Status = assignment.Status.ToString(),
            AllowLateSubmission = assignment.AllowLateSubmission,
            AllowResubmission = assignment.AllowResubmission,
            CreatedAt = assignment.CreatedAt,
            UpdatedAt = assignment.UpdatedAt ?? assignment.CreatedAt,
            ClassCourseName = classCourse.Name,
            ClassCourseSection = classCourse.Section,
            GroupName = group?.Name,
            SubjectName = subject.Name,
            TeacherName = teacher?.FullName ?? string.Empty,
            SubmittedCount = submissions.Count,
            TotalStudents = enrollments.Count,
            Attachments = attachments
        };
    }
}

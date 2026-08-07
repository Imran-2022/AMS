using AMS.Application.Contracts;
using AMS.Application.Contracts.Dtos;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class SubmissionAppService : ISubmissionAppService
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IClassCourseRepository _classCourseRepository;

    public SubmissionAppService(
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        IReadOnlyList<Submission> submissions;

        if (currentUserRole == nameof(UserRole.Admin))
        {
            submissions = await _submissionRepository.GetAllAsync(cancellationToken);
        }
        else if (currentUserRole == nameof(UserRole.Teacher))
        {
            submissions = await _submissionRepository.GetByTeacherAsync(currentUserId, cancellationToken);
        }
        else
        {
            submissions = await _submissionRepository.GetByStudentAsync(currentUserId, cancellationToken);
        }

        var results = new List<SubmissionDto>(submissions.Count);
        foreach (var submission in submissions)
        {
            results.Add(await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false));
        }
        return results;
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetMineAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Student))
        {
            throw new ForbiddenException("Only students can view their own submissions via this endpoint.");
        }

        var submissions = await _submissionRepository.GetByStudentAsync(currentUserId, cancellationToken);
        var results = new List<SubmissionDto>(submissions.Count);
        foreach (var submission in submissions)
        {
            results.Add(await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false));
        }
        return results;
    }

    public async Task<SubmissionDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken);
        if (submission is null) return null;
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> CreateAsync(CreateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Student)) throw new ForbiddenException("Only students can submit assignments.");

        var assignment = await _assignmentRepository.GetByIdAsync(input.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (assignment.Status != AssignmentStatus.Published) throw new ValidationException("Assignment is not published.");
        if (!await IsEnrolled(currentUserId, assignment.ClassCourseId)) throw new ForbiddenException("You are not enrolled in this class.");

        var existing = await _submissionRepository.GetByAssignmentAndStudentAsync(assignment.Id, currentUserId, cancellationToken);
        if (existing is not null) throw new ValidationException("A submission already exists for this assignment.");

        var submission = new Submission(Guid.NewGuid(), assignment.Id, currentUserId, input.ContentText, input.FileUrl, DateTime.UtcNow, false, SubmissionStatus.Submitted, input.FileName);
        submission.Submit(DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission, assignment);
        await _submissionRepository.AddAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> UpdateAsync(Guid id, UpdateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        if (submission.StudentId != currentUserId) throw new ForbiddenException("You can only update your own submission.");

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        
        if (submission.Status == SubmissionStatus.ResubmissionRequested)
        {
            submission.Resubmit(input.ContentText ?? submission.ContentText, input.FileUrl ?? submission.FileUrl, input.FileName ?? submission.FileName, DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission);
        }
        else
        {
            submission = new Submission(
                submission.Id,
                submission.AssignmentId,
                submission.StudentId,
                input.ContentText ?? submission.ContentText,
                input.FileUrl ?? submission.FileUrl,
                submission.SubmittedAt,
                submission.IsLate,
                submission.Status,
                input.FileName ?? submission.FileName,
                submission.ResubmittedAt,
                submission.ResubmissionCount);
        }

        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        if (submission.StudentId != currentUserId) throw new ForbiddenException("You can only delete your own submission.");
        await _submissionRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<SubmissionDto> GradeAsync(Guid id, GradeSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (currentUserRole != nameof(UserRole.Admin) && currentUserRole != nameof(UserRole.Teacher)) throw new ForbiddenException("Only teachers and admins can grade submissions.");
        if (currentUserRole != nameof(UserRole.Admin) && assignment.TeacherId != currentUserId) throw new ForbiddenException("You can only grade your own assignment submissions.");

        submission.MarkGraded(input.Marks, input.Feedback, currentUserId, assignment);
        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> UpdateStatusAsync(Guid id, UpdateSubmissionStatusDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (currentUserRole != nameof(UserRole.Admin) && currentUserRole != nameof(UserRole.Teacher)) throw new ForbiddenException("Only teachers and admins can update submission status.");
        if (currentUserRole != nameof(UserRole.Admin) && assignment.TeacherId != currentUserId) throw new ForbiddenException("You can only change status for your own assignment submissions.");

        if (Enum.TryParse<SubmissionStatus>(input.Status, true, out var parsed))
        {
            if (parsed == SubmissionStatus.ResubmissionRequested)
            {
                submission.RequestResubmission();
            }
            else
            {
                submission = new Submission(submission.Id, submission.AssignmentId, submission.StudentId, submission.ContentText, submission.FileUrl, submission.SubmittedAt, submission.IsLate, parsed, submission.FileName, submission.ResubmittedAt, submission.ResubmissionCount);
            }
            await _submissionRepository.UpdateAsync(submission, cancellationToken);
            return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
        }

        throw new ValidationException("Invalid submission status.");
    }

    private async Task<bool> IsEnrolled(Guid studentId, Guid classCourseId)
    {
        var enrollments = await _studentEnrollmentRepository.GetByStudentAsync(studentId);
        return enrollments.Any(x => x.ClassCourseId == classCourseId);
    }

    private async Task<SubmissionDto> ToDtoAsync(Submission submission, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        var student = await _userRepository.GetByIdAsync(submission.StudentId, cancellationToken) ?? throw new NotFoundException("Student not found.");
        var classCourse = await _classCourseRepository.GetByIdAsync(assignment.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");

        var initials = string.Concat(student.FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Take(2).Select(x => x[0])).ToUpperInvariant();

        return new SubmissionDto
        {
            Id = submission.Id,
            AssignmentId = submission.AssignmentId,
            StudentId = submission.StudentId,
            ContentText = submission.ContentText,
            FileUrl = submission.FileUrl,
            FileName = submission.FileName,
            SubmittedAt = submission.SubmittedAt,
            ResubmittedAt = submission.ResubmittedAt,
            ResubmissionCount = submission.ResubmissionCount,
            IsLate = submission.IsLate,
            Status = submission.Status.ToString(),
            Marks = submission.Marks,
            Feedback = submission.Feedback,
            GradedByTeacherId = submission.GradedByTeacherId,
            GradedAt = submission.GradedAt,
            StudentName = student.FullName,
            StudentInitials = initials,
            AssignmentTitle = assignment.Title,
            ClassCourseName = classCourse.Name,
            ClassCourseSection = classCourse.Section
        };
    }
}

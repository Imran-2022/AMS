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

    public SubmissionAppService(
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submissions = await _submissionRepository.GetByStudentAsync(currentUserId, cancellationToken);
        return submissions.Select(ToDto).ToList();
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetMineAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submissions = await _submissionRepository.GetByStudentAsync(currentUserId, cancellationToken);
        return submissions.Select(ToDto).ToList();
    }

    public async Task<SubmissionDto?> GetByIdAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken);
        if (submission is null) return null;
        return ToDto(submission);
    }

    public async Task<SubmissionDto> CreateAsync(CreateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        if (currentUserRole != nameof(UserRole.Student)) throw new ForbiddenException("Only students can submit assignments.");

        var assignment = await _assignmentRepository.GetByIdAsync(input.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (assignment.Status != AssignmentStatus.Published) throw new ValidationException("Assignment is not published.");
        if (!IsEnrolled(currentUserId, assignment.ClassCourseId)) throw new ForbiddenException("You are not enrolled in this class.");

        var existing = await _submissionRepository.GetByAssignmentAndStudentAsync(assignment.Id, currentUserId, cancellationToken);
        if (existing is not null) throw new ValidationException("A submission already exists for this assignment.");

        var submission = new Submission(Guid.NewGuid(), assignment.Id, currentUserId, input.ContentText, input.FileUrl, DateTime.UtcNow, false, SubmissionStatus.Submitted);
        submission.Submit(DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission, assignment);
        await _submissionRepository.AddAsync(submission, cancellationToken);
        return ToDto(submission);
    }

    public async Task<SubmissionDto> UpdateAsync(Guid id, UpdateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        if (submission.StudentId != currentUserId) throw new ForbiddenException("You can only update your own submission.");

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (input.ContentText is not null) submission = new Submission(submission.Id, submission.AssignmentId, submission.StudentId, input.ContentText, submission.FileUrl, submission.SubmittedAt, submission.IsLate, submission.Status);
        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        return ToDto(submission);
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
        return ToDto(submission);
    }

    public async Task<SubmissionDto> UpdateStatusAsync(Guid id, UpdateSubmissionStatusDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (currentUserRole != nameof(UserRole.Admin) && currentUserRole != nameof(UserRole.Teacher)) throw new ForbiddenException("Only teachers and admins can update submission status.");
        if (currentUserRole != nameof(UserRole.Admin) && assignment.TeacherId != currentUserId) throw new ForbiddenException("You can only change status for your own assignment submissions.");

        if (Enum.TryParse<SubmissionStatus>(input.Status, true, out var parsed))
        {
            submission = new Submission(submission.Id, submission.AssignmentId, submission.StudentId, submission.ContentText, submission.FileUrl, submission.SubmittedAt, submission.IsLate, parsed);
            await _submissionRepository.UpdateAsync(submission, cancellationToken);
            return ToDto(submission);
        }

        throw new ValidationException("Invalid submission status.");
    }

    private bool IsEnrolled(Guid studentId, Guid classCourseId)
    {
        return _studentEnrollmentRepository.GetByStudentAsync(studentId).GetAwaiter().GetResult().Any(x => x.ClassCourseId == classCourseId);
    }

    private static SubmissionDto ToDto(Submission submission) => new()
    {
        Id = submission.Id,
        AssignmentId = submission.AssignmentId,
        StudentId = submission.StudentId,
        ContentText = submission.ContentText,
        FileUrl = submission.FileUrl,
        SubmittedAt = submission.SubmittedAt,
        IsLate = submission.IsLate,
        Status = submission.Status.ToString(),
        Marks = submission.Marks,
        Feedback = submission.Feedback,
        GradedByTeacherId = submission.GradedByTeacherId,
        GradedAt = submission.GradedAt
    };
}

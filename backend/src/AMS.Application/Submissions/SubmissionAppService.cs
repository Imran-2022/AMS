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
    private readonly IGroupRepository _groupRepository;
    private readonly Microsoft.AspNetCore.Authorization.IAuthorizationService _authorizationService;
    private readonly AMS.Application.Contracts.ICurrentUserService _currentUser;
    private readonly IAttachmentAppService _attachmentAppService;

    public SubmissionAppService(
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository,
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        IGroupRepository groupRepository,
        Microsoft.AspNetCore.Authorization.IAuthorizationService authorizationService,
        AMS.Application.Contracts.ICurrentUserService currentUser,
        IAttachmentAppService attachmentAppService)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _groupRepository = groupRepository;
        _authorizationService = authorizationService;
        _currentUser = currentUser;
        _attachmentAppService = attachmentAppService;
    }

    public async Task<IReadOnlyList<SubmissionDto>> GetAllAsync(Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        // Use current user from ICurrentUserService to determine visible submissions
        var principal = BuildPrincipal();
        IReadOnlyList<Submission> submissions;

        if (_currentUser.Role == nameof(UserRole.Admin))
        {
            submissions = await _submissionRepository.GetAllAsync(cancellationToken);
        }
        else if (_currentUser.Role == nameof(UserRole.Teacher))
        {
            submissions = await _submissionRepository.GetByTeacherAsync(_currentUser.UserId, cancellationToken);
        }
        else
        {
            submissions = await _submissionRepository.GetByStudentAsync(_currentUser.UserId, cancellationToken);
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
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, null, "StudentsOnly");
        if (!auth.Succeeded) throw new ForbiddenException("Only students can view their own submissions via this endpoint.");

        var submissions = await _submissionRepository.GetByStudentAsync(_currentUser.UserId, cancellationToken);
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
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, id, new Microsoft.AspNetCore.Authorization.IAuthorizationRequirement[] { new AMS.Application.Contracts.Authorization.SubmissionAccessRequirement() });
        if (!auth.Succeeded) throw new ForbiddenException("Access denied.");

        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> CreateAsync(CreateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, null, "StudentsOnly");
        if (!auth.Succeeded) throw new ForbiddenException("Only students can submit assignments.");

        var assignment = await _assignmentRepository.GetByIdAsync(input.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        if (assignment.Status != AssignmentStatus.Published) throw new ValidationException("Assignment is not published.");
        if (!await IsEnrolled(_currentUser.UserId, assignment.ClassCourseId)) throw new ForbiddenException("You are not enrolled in this class.");

        var existing = await _submissionRepository.GetByAssignmentAndStudentAsync(assignment.Id, _currentUser.UserId, cancellationToken);
        if (existing is not null)
        {
            if (existing.Status == SubmissionStatus.Graded) throw new ValidationException("A graded submission cannot be resubmitted.");
            if (!assignment.AllowResubmission) throw new ValidationException("Resubmission is not allowed for this assignment.");

            existing.Resubmit(input.ContentText, input.FileUrl, input.FileName, DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission);
            await _submissionRepository.UpdateAsync(existing, cancellationToken);
            return await ToDtoAsync(existing, cancellationToken).ConfigureAwait(false);
        }

        var submission = new Submission(Guid.NewGuid(), assignment.Id, _currentUser.UserId, input.ContentText, input.FileUrl, input.FileName, DateTime.UtcNow, false, SubmissionStatus.Submitted);
        submission.Submit(DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission, assignment);
        await _submissionRepository.AddAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> UpdateAsync(Guid id, UpdateSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, id, new Microsoft.AspNetCore.Authorization.IAuthorizationRequirement[] { new AMS.Application.Contracts.Authorization.SubmissionAccessRequirement() });
        if (!auth.Succeeded) throw new ForbiddenException("You can only update your own submission.");

        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");

        if (submission.Status != SubmissionStatus.ResubmissionRequested && !assignment.AllowResubmission)
        {
            throw new ValidationException("Resubmission is not allowed for this assignment.");
        }
        
        if (submission.Status == SubmissionStatus.ResubmissionRequested)
        {
            submission.Resubmit(input.ContentText ?? submission.ContentText, input.FileUrl ?? submission.FileUrl, input.FileName ?? submission.FileName, DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission);
        }
        else
        {
            // Allow editing before deadline (or if late submissions allowed). Disallow edits to graded submissions.
            submission.EditBeforeDeadline(input.ContentText ?? submission.ContentText, input.FileUrl ?? submission.FileUrl, input.FileName ?? submission.FileName, DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission);
        }

        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task DeleteAsync(Guid id, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, id, new Microsoft.AspNetCore.Authorization.IAuthorizationRequirement[] { new AMS.Application.Contracts.Authorization.SubmissionAccessRequirement() });
        if (!auth.Succeeded) throw new ForbiddenException("You can only delete your own submission.");
        await _submissionRepository.DeleteAsync(id, cancellationToken);
    }

    public async Task<SubmissionDto> GradeAsync(Guid id, GradeSubmissionDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, id, "TeachersOrAdmins");
        if (!auth.Succeeded) throw new ForbiddenException("Only teachers and admins can grade submissions.");

        submission.MarkGraded(input.Marks, input.Feedback, _currentUser.UserId, assignment);
        await _submissionRepository.UpdateAsync(submission, cancellationToken);
        return await ToDtoAsync(submission, cancellationToken).ConfigureAwait(false);
    }

    public async Task<SubmissionDto> UpdateStatusAsync(Guid id, UpdateSubmissionStatusDto input, Guid currentUserId, string currentUserRole, CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdAsync(id, cancellationToken) ?? throw new NotFoundException("Submission not found.");
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        var principal = BuildPrincipal();
        var auth = await _authorizationService.AuthorizeAsync(principal, id, "TeachersOrAdmins");
        if (!auth.Succeeded) throw new ForbiddenException("Only teachers and admins can update submission status.");

        if (Enum.TryParse<SubmissionStatus>(input.Status, true, out var parsed))
        {
            if (parsed == SubmissionStatus.ResubmissionRequested)
            {
                submission.RequestResubmission();
            }
            else
            {
                submission.UpdateStatus(parsed);
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

    private System.Security.Claims.ClaimsPrincipal BuildPrincipal()
    {
        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, _currentUser.UserId.ToString()),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, _currentUser.Role)
        };
        return new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(claims, "AppService"));
    }

    private async Task<SubmissionDto> ToDtoAsync(Submission submission, CancellationToken cancellationToken = default)
    {
        var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId, cancellationToken) ?? throw new NotFoundException("Assignment not found.");
        var student = await _userRepository.GetByIdAsync(submission.StudentId, cancellationToken) ?? throw new NotFoundException("Student not found.");
        var classCourse = await _classCourseRepository.GetByIdAsync(assignment.ClassCourseId, cancellationToken) ?? throw new NotFoundException("Class/course not found.");
        var group = classCourse.GroupId.HasValue ? await _groupRepository.GetByIdAsync(classCourse.GroupId.Value, cancellationToken) : null;
        var attachments = await _attachmentAppService.ListAsync("Submission", submission.Id);

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
            AvatarUrl = student.AvatarUrl,
            AssignmentTitle = assignment.Title,
            MaxMarks = assignment.MaxMarks,
            ClassCourseName = classCourse.Name,
            ClassCourseSection = classCourse.Section,
            GroupName = group?.Name,
            Attachments = attachments
        };
    }
}

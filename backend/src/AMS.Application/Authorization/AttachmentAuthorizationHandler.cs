using AMS.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using AMS.Application.Contracts.Authorization;

namespace AMS.Application.Authorization;

public class AttachmentAuthorizationHandler : AuthorizationHandler<AttachmentAccessRequirement, string>
{
    private readonly IAttachmentRepository _attachmentRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IStudentEnrollmentRepository _studentEnrollmentRepository;

    public AttachmentAuthorizationHandler(
        IAttachmentRepository attachmentRepository,
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        ISubjectRepository subjectRepository,
        IStudentEnrollmentRepository studentEnrollmentRepository)
    {
        _attachmentRepository = attachmentRepository;
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _subjectRepository = subjectRepository;
        _studentEnrollmentRepository = studentEnrollmentRepository;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, AttachmentAccessRequirement requirement, string resource)
    {
        var user = context.User;
        var idClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
        Guid currentUserId = Guid.Empty;
        if (idClaim != null) Guid.TryParse(idClaim.Value, out currentUserId);
        var isAdmin = user.IsInRole("Admin");
        var isTeacher = user.IsInRole("Teacher");

        if (isAdmin)
        {
            context.Succeed(requirement);
            return;
        }

        var attachment = await _attachmentRepository.GetByStoredFileNameAsync(resource);
        if (attachment == null) return;

        if (!isTeacher)
        {
            if (attachment.OwnerType == "Submission")
            {
                var submission = await _submissionRepository.GetByIdAsync(attachment.OwnerId);
                if (submission != null && submission.StudentId == currentUserId)
                {
                    context.Succeed(requirement);
                    return;
                }
            }
            else if (attachment.OwnerType == "Assignment")
            {
                var assignment = await _assignmentRepository.GetByIdAsync(attachment.OwnerId);
                if (assignment != null)
                {
                    var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId);
                    if (subject != null)
                    {
                        var enrollments = await _studentEnrollmentRepository.GetByStudentAsync(currentUserId);
                        if (enrollments.Any(e => e.ClassCourseId == subject.ClassCourseId))
                        {
                            context.Succeed(requirement);
                            return;
                        }
                    }
                }
            }
        }
        else
        {
            if (attachment.OwnerType == "Submission")
            {
                var submission = await _submissionRepository.GetByIdAsync(attachment.OwnerId);
                if (submission != null)
                {
                    var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
                    if (assignment != null && assignment.TeacherId == currentUserId)
                    {
                        context.Succeed(requirement);
                        return;
                    }
                }
            }
            else if (attachment.OwnerType == "Assignment")
            {
                var assignment = await _assignmentRepository.GetByIdAsync(attachment.OwnerId);
                if (assignment != null && assignment.TeacherId == currentUserId)
                {
                    context.Succeed(requirement);
                    return;
                }
            }
        }
    }
}

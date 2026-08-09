using AMS.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using AMS.Application.Contracts.Authorization;

namespace AMS.Application.Authorization;

public class SubmissionAuthorizationHandler : AuthorizationHandler<SubmissionAccessRequirement, Guid>
{
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;

    public SubmissionAuthorizationHandler(ISubmissionRepository submissionRepository, IAssignmentRepository assignmentRepository)
    {
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
    }

    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, SubmissionAccessRequirement requirement, Guid resource)
    {
        // resolve user id and role
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

        var submission = await _submissionRepository.GetByIdAsync(resource);
        if (submission == null) return;

        if (!isTeacher && submission.StudentId == currentUserId)
        {
            context.Succeed(requirement);
            return;
        }

        if (isTeacher)
        {
            var assignment = await _assignmentRepository.GetByIdAsync(submission.AssignmentId);
            if (assignment != null && assignment.TeacherId == currentUserId)
            {
                context.Succeed(requirement);
                return;
            }
        }
    }
}

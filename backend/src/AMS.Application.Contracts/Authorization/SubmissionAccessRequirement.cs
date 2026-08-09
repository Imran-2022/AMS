using Microsoft.AspNetCore.Authorization;

namespace AMS.Application.Contracts.Authorization;

public class SubmissionAccessRequirement : IAuthorizationRequirement
{
    // marker requirement for submission access
}

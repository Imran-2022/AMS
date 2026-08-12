namespace AMS.Domain.Shared;

public enum UserRole
{
    Admin = 1,
    Teacher = 2,
    Student = 3
}

public enum AssignmentStatus
{
    Draft = 1,
    Published = 2
}

public enum SubmissionStatus
{
    Submitted = 1,
    Late = 2,
    UnderReview = 3,
    Graded = 4,
    ResubmissionRequested = 5,
    Resubmitted = 6
}

public enum NotificationType
{
    AssignmentPublished = 1,
    SubmissionReceived = 2,
    SubmissionGraded = 3,
    ResubmissionRequested = 4
}

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
    ResubmissionRequested = 5
}

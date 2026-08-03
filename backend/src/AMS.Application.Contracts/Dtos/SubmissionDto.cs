namespace AMS.Application.Contracts.Dtos;

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }
    public string ContentText { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public DateTime SubmittedAt { get; set; }
    public bool IsLate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public Guid? GradedByTeacherId { get; set; }
    public DateTime? GradedAt { get; set; }
}

public class CreateSubmissionDto
{
    public Guid AssignmentId { get; set; }
    public string ContentText { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
}

public class UpdateSubmissionDto
{
    public string? ContentText { get; set; }
    public string? FileUrl { get; set; }
}

public class GradeSubmissionDto
{
    public int Marks { get; set; }
    public string? Feedback { get; set; }
}

public class UpdateSubmissionStatusDto
{
    public string Status { get; set; } = string.Empty;
}

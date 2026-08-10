namespace AMS.Application.Contracts.Dtos;

public class SubmissionDto
{
    public Guid Id { get; set; }
    public Guid AssignmentId { get; set; }
    public Guid StudentId { get; set; }
    public string ContentText { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime? ResubmittedAt { get; set; }
    public int ResubmissionCount { get; set; }
    public bool IsLate { get; set; }
    public string Status { get; set; } = string.Empty;
    public int? Marks { get; set; }
    public string? Feedback { get; set; }
    public Guid? GradedByTeacherId { get; set; }
    public DateTime? GradedAt { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentInitials { get; set; } = string.Empty;
    public string AssignmentTitle { get; set; } = string.Empty;
    public int MaxMarks { get; set; }
    public string ClassCourseName { get; set; } = string.Empty;
    public string ClassCourseSection { get; set; } = string.Empty;
    public string? GroupName { get; set; }
    public IReadOnlyList<AttachmentDto> Attachments { get; set; } = Array.Empty<AttachmentDto>();
}

public class CreateSubmissionDto
{
    public Guid AssignmentId { get; set; }
    public string ContentText { get; set; } = string.Empty;
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
}

public class UpdateSubmissionDto
{
    public string? ContentText { get; set; }
    public string? FileUrl { get; set; }
    public string? FileName { get; set; }
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

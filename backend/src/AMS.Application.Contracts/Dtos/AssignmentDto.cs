namespace AMS.Application.Contracts.Dtos;

public class AssignmentDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public Guid ClassCourseId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid TeacherId { get; set; }
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool AllowLateSubmission { get; set; }
    public bool AllowResubmission { get; set; }
    public DateTime CreatedAt { get; set; }
    public string ClassCourseName { get; set; } = string.Empty;
    public string ClassCourseSection { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public int SubmittedCount { get; set; }
    public int TotalStudents { get; set; }
}

public class CreateAssignmentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public Guid ClassCourseId { get; set; }
    public Guid SubjectId { get; set; }
    public Guid? TeacherId { get; set; }
    public DateTime Deadline { get; set; }
    public int MaxMarks { get; set; }
    public bool AllowLateSubmission { get; set; }
    public bool AllowResubmission { get; set; }
}

public class UpdateAssignmentDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? AttachmentUrl { get; set; }
    public string? AttachmentName { get; set; }
    public Guid? ClassCourseId { get; set; }
    public Guid? SubjectId { get; set; }
    public DateTime? Deadline { get; set; }
    public int? MaxMarks { get; set; }
    public bool? AllowLateSubmission { get; set; }
    public bool? AllowResubmission { get; set; }
}

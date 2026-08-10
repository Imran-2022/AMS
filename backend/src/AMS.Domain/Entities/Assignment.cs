using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public string? AttachmentUrl { get; private set; }
    public string? AttachmentName { get; private set; }
    public Guid ClassCourseId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    public DateTime Deadline { get; private set; }
    public int MaxMarks { get; private set; }
    public AssignmentStatus Status { get; private set; }
    public bool AllowLateSubmission { get; private set; }
    public bool AllowResubmission { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Assignment() { }

    public Assignment(Guid id, string title, string description, Guid classCourseId, Guid subjectId, Guid teacherId,
        DateTime deadline, int maxMarks, AssignmentStatus status, bool allowLateSubmission, bool allowResubmission, DateTime createdAt,
        string? attachmentUrl = null, string? attachmentName = null)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (maxMarks <= 0) throw new DomainException("Max marks must be positive.");
        if (deadline == default) throw new DomainException("Deadline is required.");

        Id = id;
        Title = title;
        Description = description ?? string.Empty;
        AttachmentUrl = attachmentUrl;
        AttachmentName = attachmentName;
        ClassCourseId = classCourseId;
        SubjectId = subjectId;
        TeacherId = teacherId;
        Deadline = deadline;
        MaxMarks = maxMarks;
        Status = status;
        AllowLateSubmission = allowLateSubmission;
        AllowResubmission = allowResubmission;
        CreatedAt = createdAt == default ? DateTime.UtcNow : createdAt;
    }

    public void SetAttachment(string? attachmentUrl, string? attachmentName)
    {
        AttachmentUrl = attachmentUrl;
        AttachmentName = attachmentName;
    }

    public void UpdateDetails(string title, string description, Guid classCourseId, Guid subjectId, DateTime deadline,
        int maxMarks, bool allowLateSubmission, bool allowResubmission, string? attachmentUrl, string? attachmentName)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (maxMarks <= 0) throw new DomainException("Max marks must be positive.");
        if (deadline == default) throw new DomainException("Deadline is required.");

        Title = title;
        Description = description ?? string.Empty;
        ClassCourseId = classCourseId;
        SubjectId = subjectId;
        Deadline = deadline;
        MaxMarks = maxMarks;
        AllowLateSubmission = allowLateSubmission;
        AllowResubmission = allowResubmission;
        AttachmentUrl = attachmentUrl;
        AttachmentName = attachmentName;
    }

    public void Publish()
    {
        Status = AssignmentStatus.Published;
    }

    public void Unpublish()
    {
        Status = AssignmentStatus.Draft;
    }
}

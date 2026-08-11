using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; }
    public string Title { get; private set; } = null!;
    public string Description { get; private set; } = null!;
    public Guid ClassCourseId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid TeacherId { get; private set; }
    public string? AttachmentUrl { get; private set; }
    public string? AttachmentName { get; private set; }
    public DateTime Deadline { get; private set; }
    public int MaxMarks { get; private set; }
    public AssignmentStatus Status { get; private set; }
    public bool AllowLateSubmission { get; private set; }
    public bool AllowResubmission { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public ClassCourse ClassCourse { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;
    public User Teacher { get; private set; } = null!;

    private Assignment() { }

    public Assignment(Guid id, string title, string description, Guid classCourseId, Guid subjectId, Guid teacherId,
        DateTime deadline, int maxMarks, AssignmentStatus status, bool allowLateSubmission, bool allowResubmission, DateTime createdAt,
        string? attachmentUrl = null, string? attachmentName = null)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");
        if (subjectId == Guid.Empty) throw new DomainException("Subject is required.");
        if (teacherId == Guid.Empty) throw new DomainException("Teacher is required.");
        if (maxMarks <= 0) throw new DomainException("Max marks must be positive.");
        if (deadline == default) throw new DomainException("Deadline is required.");

        Id = id;
        Title = title;
        Description = description ?? string.Empty;
        ClassCourseId = classCourseId;
        SubjectId = subjectId;
        TeacherId = teacherId;
        AttachmentUrl = attachmentUrl;
        AttachmentName = attachmentName;
        Deadline = deadline;
        MaxMarks = maxMarks;
        Status = status;
        AllowLateSubmission = allowLateSubmission;
        AllowResubmission = allowResubmission;
        CreatedAt = createdAt.Kind switch
        {
            DateTimeKind.Utc => createdAt,
            DateTimeKind.Local => createdAt.ToUniversalTime(),
            _ => DateTime.SpecifyKind(createdAt, DateTimeKind.Utc)
        };
    }

    public void UpdateDetails(string title, string description, Guid classCourseId, Guid subjectId, DateTime deadline,
        int maxMarks, bool allowLateSubmission, bool allowResubmission, string? attachmentUrl, string? attachmentName)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");
        if (subjectId == Guid.Empty) throw new DomainException("Subject is required.");
        if (maxMarks <= 0) throw new DomainException("Max marks must be positive.");
        if (deadline == default) throw new DomainException("Deadline is required.");

        Title = title;
        Description = description ?? string.Empty;
        ClassCourseId = classCourseId;
        SubjectId = subjectId;
        AttachmentUrl = attachmentUrl;
        AttachmentName = attachmentName;
        Deadline = deadline;
        MaxMarks = maxMarks;
        AllowLateSubmission = allowLateSubmission;
        AllowResubmission = allowResubmission;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Publish()
    {
        Status = AssignmentStatus.Published;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Unpublish()
    {
        Status = AssignmentStatus.Draft;
        UpdatedAt = DateTime.UtcNow;
    }
}

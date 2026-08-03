using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
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
        DateTime deadline, int maxMarks, AssignmentStatus status, bool allowLateSubmission, bool allowResubmission, DateTime createdAt)
    {
        if (string.IsNullOrWhiteSpace(title)) throw new DomainException("Title is required.");
        if (maxMarks <= 0) throw new DomainException("Max marks must be positive.");
        if (deadline == default) throw new DomainException("Deadline is required.");

        Id = id;
        Title = title;
        Description = description ?? string.Empty;
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

    public void Publish()
    {
        Status = AssignmentStatus.Published;
    }

    public void Unpublish()
    {
        Status = AssignmentStatus.Draft;
    }
}

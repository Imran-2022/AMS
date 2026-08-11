using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Submission
{
    public Guid Id { get; private set; }
    public Guid AssignmentId { get; private set; }
    public Guid StudentId { get; private set; }
    public string ContentText { get; private set; } = null!;
    public string? FileUrl { get; private set; }
    public string? FileName { get; private set; }
    public DateTime SubmittedAt { get; private set; }
    public DateTime? ResubmittedAt { get; private set; }
    public int ResubmissionCount { get; private set; }
    public bool IsLate { get; private set; }
    public SubmissionStatus Status { get; private set; }
    public int? Marks { get; private set; }
    public string? Feedback { get; private set; }
    public Guid? GradedByTeacherId { get; private set; }
    public DateTime? GradedAt { get; private set; }

    public Assignment Assignment { get; private set; } = null!;
    public User Student { get; private set; } = null!;

    private Submission() { }

    public Submission(Guid id, Guid assignmentId, Guid studentId, string contentText, string? fileUrl, string? fileName, DateTime submittedAt, bool isLate, SubmissionStatus status,
        DateTime? resubmittedAt = null, int resubmissionCount = 0)
    {
        if (assignmentId == Guid.Empty) throw new DomainException("Assignment is required.");
        if (studentId == Guid.Empty) throw new DomainException("Student is required.");

        Id = id;
        AssignmentId = assignmentId;
        StudentId = studentId;
        ContentText = contentText ?? string.Empty;
        FileUrl = fileUrl;
        FileName = fileName;
        SubmittedAt = submittedAt == default ? DateTime.UtcNow : submittedAt;
        ResubmittedAt = resubmittedAt;
        ResubmissionCount = resubmissionCount;
        IsLate = isLate;
        Status = status;
    }

    public void Submit(DateTime now, DateTime deadline, bool allowLateSubmission, Assignment assignment)
    {
        if (now > deadline && !allowLateSubmission)
        {
            throw new DomainException("Submission is past the deadline and late submissions are not allowed.");
        }

        IsLate = now > deadline;
        Status = IsLate ? SubmissionStatus.Late : SubmissionStatus.Submitted;
        SubmittedAt = now;
    }

    public void RequestResubmission()
    {
        Status = SubmissionStatus.ResubmissionRequested;
    }

    public void UpdateStatus(SubmissionStatus status)
    {
        Status = status;
    }

    public void Resubmit(string contentText, string? fileUrl, string? fileName, DateTime now, DateTime deadline, bool allowLateSubmission)
    {
        if (now > deadline && !allowLateSubmission)
        {
            throw new DomainException("Resubmission is past the deadline and late submissions are not allowed.");
        }

        ContentText = contentText ?? string.Empty;
        FileUrl = fileUrl;
        FileName = fileName;
        ResubmittedAt = now;
        ResubmissionCount++;
        IsLate = now > deadline;
        Status = IsLate ? SubmissionStatus.Late : SubmissionStatus.Resubmitted;
        Marks = null;
        Feedback = null;
        GradedByTeacherId = null;
        GradedAt = null;
    }

    public void EditBeforeDeadline(string contentText, string? fileUrl, string? fileName, DateTime now, DateTime deadline, bool allowLateSubmission)
    {
        if (Status == SubmissionStatus.Graded) throw new DomainException("Cannot edit a graded submission.");
        if (now > deadline && !allowLateSubmission) throw new DomainException("Submission is past the deadline and late submissions are not allowed.");

        ContentText = contentText ?? string.Empty;
        FileUrl = fileUrl;
        FileName = fileName;
        // keep original SubmittedAt; update late flag
        IsLate = now > deadline;
    }

    public void MarkGraded(int marks, string? feedback, Guid teacherId, Assignment assignment)
    {
        if (marks < 0) throw new DomainException("Marks cannot be negative.");
        if (marks > assignment.MaxMarks) throw new DomainException("Marks cannot exceed the assignment max marks.");

        Marks = marks;
        Feedback = feedback;
        GradedByTeacherId = teacherId;
        GradedAt = DateTime.UtcNow;
        Status = SubmissionStatus.Graded;
    }
}

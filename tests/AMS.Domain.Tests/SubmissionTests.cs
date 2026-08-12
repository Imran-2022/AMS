using AMS.Domain.Entities;
using AMS.Domain.Shared;
using Xunit;

namespace AMS.Domain.Tests;

public class SubmissionTests
{
    [Fact]
    public void Submit_When_Late_And_Not_Allowed_Should_Throw()
    {
        var assignment = new Assignment(Guid.NewGuid(), "Title", "Desc", Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(-1), 100, AssignmentStatus.Published, false, false, DateTime.UtcNow);
        var submission = new Submission(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted);

        var ex = Assert.Throws<DomainException>(() => submission.Submit(DateTime.UtcNow, assignment.Deadline, assignment.AllowLateSubmission, assignment));

        Assert.Contains("deadline", ex.Message);
    }

    [Fact]
    public void MarkGraded_Should_Reject_Marks_Above_MaxMarks()
    {
        var assignment = new Assignment(Guid.NewGuid(), "Title", "Desc", Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 100, AssignmentStatus.Published, true, false, DateTime.UtcNow);
        var submission = new Submission(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted);

        var ex = Assert.Throws<DomainException>(() => submission.MarkGraded(101, "Too high", Guid.NewGuid(), assignment));

        Assert.Contains("exceed", ex.Message);
    }

    [Fact]
    public void UpdateStatus_Should_Preserve_Grade_And_Feedback()
    {
        var assignment = new Assignment(Guid.NewGuid(), "Title", "Desc", Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 35, AssignmentStatus.Published, true, false, DateTime.UtcNow);
        var submission = new Submission(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted);

        submission.MarkGraded(23, "Good first attempt", Guid.NewGuid(), assignment);
        submission.UpdateStatus(SubmissionStatus.UnderReview);

        Assert.Equal(23, submission.Marks);
        Assert.Equal("Good first attempt", submission.Feedback);
        Assert.Equal(SubmissionStatus.UnderReview, submission.Status);
    }
}

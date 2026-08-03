using AMS.Domain.Entities;
using AMS.Domain.Shared;
using Xunit;

namespace AMS.Domain.Tests;

public class AssignmentTests
{
    [Fact]
    public void Publish_Should_Set_Status_To_Published()
    {
        var assignment = new Assignment(Guid.NewGuid(), "Title", "Desc", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 100, AssignmentStatus.Draft, true, false, DateTime.UtcNow);

        assignment.Publish();

        Assert.Equal(AssignmentStatus.Published, assignment.Status);
    }

    [Fact]
    public void Unpublish_Should_Set_Status_To_Draft()
    {
        var assignment = new Assignment(Guid.NewGuid(), "Title", "Desc", Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 100, AssignmentStatus.Published, true, false, DateTime.UtcNow);

        assignment.Unpublish();

        Assert.Equal(AssignmentStatus.Draft, assignment.Status);
    }
}

using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class StudentEnrollment
{
    public Guid StudentId { get; private set; }
    public Guid ClassCourseId { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime EnrolledAt { get; private set; }

    public User Student { get; private set; } = null!;
    public ClassCourse ClassCourse { get; private set; } = null!;

    private StudentEnrollment() { }

    public StudentEnrollment(Guid studentId, Guid classCourseId, bool isActive = true, DateTime? enrolledAt = null)
    {
        if (studentId == Guid.Empty) throw new DomainException("Student is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");

        StudentId = studentId;
        ClassCourseId = classCourseId;
        IsActive = isActive;
        EnrolledAt = enrolledAt?.Kind switch
        {
            DateTimeKind.Local => enrolledAt.Value.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(enrolledAt.Value, DateTimeKind.Utc),
            _ => enrolledAt.Value
        };
        if (enrolledAt is null) EnrolledAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

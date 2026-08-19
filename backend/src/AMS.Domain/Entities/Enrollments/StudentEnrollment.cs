using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class StudentEnrollment
{
    public Guid StudentId { get; private set; }
    public Guid ClassCourseId { get; private set; }
    public Guid AcademicYearId { get; private set; }
    public string? RollNumber { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime EnrolledAt { get; private set; }

    public User Student { get; private set; } = null!;
    public ClassCourse ClassCourse { get; private set; } = null!;
    public AcademicYear AcademicYear { get; private set; } = null!;

    private StudentEnrollment() { }

    public StudentEnrollment(Guid studentId, Guid classCourseId, Guid academicYearId, string? rollNumber = null, bool isActive = true, DateTime? enrolledAt = null)
    {
        if (studentId == Guid.Empty) throw new DomainException("Student is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");
        if (academicYearId == Guid.Empty) throw new DomainException("Academic year is required.");

        StudentId = studentId;
        ClassCourseId = classCourseId;
        AcademicYearId = academicYearId;
        RollNumber = rollNumber;
        IsActive = isActive;

        var effectiveEnrolledAt = enrolledAt ?? DateTime.UtcNow;
        EnrolledAt = effectiveEnrolledAt.Kind switch
        {
            DateTimeKind.Local => effectiveEnrolledAt.ToUniversalTime(),
            DateTimeKind.Unspecified => DateTime.SpecifyKind(effectiveEnrolledAt, DateTimeKind.Utc),
            _ => effectiveEnrolledAt
        };
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

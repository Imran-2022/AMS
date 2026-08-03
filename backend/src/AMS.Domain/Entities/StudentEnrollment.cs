using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class StudentEnrollment
{
    public Guid StudentId { get; private set; }
    public Guid ClassCourseId { get; private set; }

    private StudentEnrollment() { }

    public StudentEnrollment(Guid studentId, Guid classCourseId)
    {
        StudentId = studentId;
        ClassCourseId = classCourseId;
    }
}

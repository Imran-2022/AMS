using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class TeacherSubjectAssignment
{
    public Guid TeacherId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid ClassCourseId { get; private set; }

    public User Teacher { get; private set; } = null!;
    public Subject Subject { get; private set; } = null!;
    public ClassCourse ClassCourse { get; private set; } = null!;

    private TeacherSubjectAssignment() { }

    public TeacherSubjectAssignment(Guid teacherId, Guid subjectId, Guid classCourseId)
    {
        if (teacherId == Guid.Empty) throw new DomainException("Teacher is required.");
        if (subjectId == Guid.Empty) throw new DomainException("Subject is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");

        TeacherId = teacherId;
        SubjectId = subjectId;
        ClassCourseId = classCourseId;
    }
}

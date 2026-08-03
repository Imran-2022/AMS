using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class TeacherSubjectAssignment
{
    public Guid TeacherId { get; private set; }
    public Guid SubjectId { get; private set; }
    public Guid ClassCourseId { get; private set; }

    private TeacherSubjectAssignment() { }

    public TeacherSubjectAssignment(Guid teacherId, Guid subjectId, Guid classCourseId)
    {
        TeacherId = teacherId;
        SubjectId = subjectId;
        ClassCourseId = classCourseId;
    }
}

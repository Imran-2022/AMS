namespace AMS.Application.Contracts.Dtos;

public class TeacherSubjectAssignmentDto
{
    public Guid TeacherId { get; set; }
    public string TeacherName { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid ClassCourseId { get; set; }
    public string ClassCourseName { get; set; } = string.Empty;
}

public class CreateTeacherSubjectAssignmentDto
{
    public Guid TeacherId { get; set; }
    public Guid SubjectId { get; set; }
}
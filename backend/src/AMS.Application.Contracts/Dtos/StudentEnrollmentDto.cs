namespace AMS.Application.Contracts.Dtos;

public class StudentEnrollmentDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public Guid ClassCourseId { get; set; }
    public string ClassCourseName { get; set; } = string.Empty;
}

public class CreateStudentEnrollmentDto
{
    public Guid StudentId { get; set; }
    public Guid ClassCourseId { get; set; }
}

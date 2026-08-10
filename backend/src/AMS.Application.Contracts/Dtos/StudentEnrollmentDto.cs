namespace AMS.Application.Contracts.Dtos;

public class StudentEnrollmentDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public Guid ClassCourseId { get; set; }
    public string ClassCourseName { get; set; } = string.Empty;
    public string ParentMobile { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AvatarUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class CreateStudentEnrollmentDto
{
    public Guid StudentId { get; set; }
    public Guid ClassCourseId { get; set; }
}

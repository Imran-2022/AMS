namespace AMS.Application.Contracts.Dtos;

public class ClassCourseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
}

public class CreateClassCourseDto
{
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
}

public class UpdateClassCourseDto
{
    public string? Name { get; set; }
    public string? Section { get; set; }
    public string? AcademicYear { get; set; }
}

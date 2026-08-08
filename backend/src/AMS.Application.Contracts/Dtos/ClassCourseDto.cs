namespace AMS.Application.Contracts.Dtos;

public class ClassCourseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
    public Guid? ClassDefinitionId { get; set; }
    public string? ClassDefinitionName { get; set; }
    public Guid? GroupId { get; set; }
    public string? GroupName { get; set; }
}

public class CreateClassCourseDto
{
    // Preferred: use ClassDefinitionId to select a canonical Class. If omitted, Name will be used.
    public Guid? ClassDefinitionId { get; set; }
    public Guid? GroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string AcademicYear { get; set; } = string.Empty;
}

public class UpdateClassCourseDto
{
    public Guid? ClassDefinitionId { get; set; }
    public Guid? GroupId { get; set; }
    public string? Name { get; set; }
    public string? Section { get; set; }
    public string? AcademicYear { get; set; }
}

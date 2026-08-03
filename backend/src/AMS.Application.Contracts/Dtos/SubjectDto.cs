namespace AMS.Application.Contracts.Dtos;

public class SubjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid ClassCourseId { get; set; }
}

public class CreateSubjectDto
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public Guid ClassCourseId { get; set; }
}

public class UpdateSubjectDto
{
    public string? Name { get; set; }
    public string? Code { get; set; }
    public Guid? ClassCourseId { get; set; }
}

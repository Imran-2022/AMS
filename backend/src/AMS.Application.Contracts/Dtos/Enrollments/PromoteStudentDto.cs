namespace AMS.Application.Contracts.Dtos;

public class PromoteStudentDto
{
    public Guid StudentId { get; set; }
    public Guid FromClassCourseId { get; set; }
    public Guid ToClassCourseId { get; set; }
    public string? NewRollNumber { get; set; }
}

public class BulkPromoteStudentsDto
{
    public Guid FromClassCourseId { get; set; }
    public Guid ToClassCourseId { get; set; }
    public List<PromoteStudentBulkItemDto> Students { get; set; } = [];
}

public class PromoteStudentBulkItemDto
{
    public Guid StudentId { get; set; }
    public string? NewRollNumber { get; set; }
}

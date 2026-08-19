namespace AMS.Application.Contracts.Dtos;

public class ReassignTeacherDto
{
    public Guid TeacherId { get; set; }
    public Guid FromSubjectId { get; set; }
    public Guid ToSubjectId { get; set; }
}

public class BulkReassignTeachersDto
{
    public Guid FromSubjectId { get; set; }
    public Guid ToSubjectId { get; set; }
    public List<Guid> TeacherIds { get; set; } = [];
}

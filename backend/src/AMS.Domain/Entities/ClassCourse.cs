using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class ClassCourse
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Section { get; private set; } = null!;
    public string AcademicYear { get; private set; } = null!;
    public Guid? ClassDefinitionId { get; private set; }
    public Guid? GroupId { get; private set; }

    private ClassCourse() { }

    public ClassCourse(Guid id, string name, string section, string academicYear, Guid? classDefinitionId = null, Guid? groupId = null)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new DomainException("Class name is required.");
        if (string.IsNullOrWhiteSpace(section)) throw new DomainException("Section is required.");
        if (string.IsNullOrWhiteSpace(academicYear)) throw new DomainException("Academic year is required.");

        Id = id;
        Name = name;
        Section = section;
        AcademicYear = academicYear;
        ClassDefinitionId = classDefinitionId;
        GroupId = groupId;
    }
}

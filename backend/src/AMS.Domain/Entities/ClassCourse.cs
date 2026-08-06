using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class ClassCourse
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Section { get; private set; } = null!;
    public string AcademicYear { get; private set; } = null!;

    private ClassCourse() { }

    public ClassCourse(Guid id, string name, string section, string academicYear)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new DomainException("Class name is required.");
        if (string.IsNullOrWhiteSpace(section)) throw new DomainException("Section is required.");
        if (string.IsNullOrWhiteSpace(academicYear)) throw new DomainException("Academic year is required.");

        Id = id;
        Name = name;
        Section = section;
        AcademicYear = academicYear;
    }
}

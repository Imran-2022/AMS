using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class ClassCourse
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Section { get; private set; } = null!;
    public Guid AcademicYearId { get; private set; }
    public Guid ClassDefinitionId { get; private set; }
    public Guid? GroupId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public AcademicYear AcademicYear { get; private set; } = null!;
    public ClassDefinition ClassDefinition { get; private set; } = null!;
    public Group? Group { get; private set; }

    private ClassCourse() { }

    public ClassCourse(Guid id, string name, string section, Guid academicYearId, Guid classDefinitionId, Guid? groupId = null, DateTime? createdAt = null, DateTime? updatedAt = null)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new DomainException("Class name is required.");
        if (string.IsNullOrWhiteSpace(section)) throw new DomainException("Section is required.");
        if (academicYearId == Guid.Empty) throw new DomainException("Academic year is required.");
        if (classDefinitionId == Guid.Empty) throw new DomainException("Class definition is required.");

        Id = id;
        Name = name;
        Section = section;
        AcademicYearId = academicYearId;
        ClassDefinitionId = classDefinitionId;
        GroupId = groupId;
        if (createdAt.HasValue)
        {
            CreatedAt = createdAt.Value.Kind switch
            {
                DateTimeKind.Local => createdAt.Value.ToUniversalTime(),
                DateTimeKind.Unspecified => DateTime.SpecifyKind(createdAt.Value, DateTimeKind.Utc),
                _ => createdAt.Value
            };
        }
        else
        {
            CreatedAt = DateTime.UtcNow;
        }
        UpdatedAt = updatedAt;
    }

    // Back-compat constructor used by EF repository fallback when the database
    // still has the legacy `academic_year` string column. This creates a
    // minimal instance without enforcing the academic year GUID constraint.
    public ClassCourse(Guid id, string name, string section, string academicYearString)
    {
        Id = id;
        Name = name ?? string.Empty;
        Section = section ?? string.Empty;
        AcademicYearId = Guid.Empty;
        CreatedAt = DateTime.UtcNow;
    }

    public void SetUpdated()
    {
        UpdatedAt = DateTime.UtcNow;
    }
}

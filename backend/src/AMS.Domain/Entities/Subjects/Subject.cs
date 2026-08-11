using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Subject
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public string Code { get; private set; } = null!;
    public Guid ClassCourseId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public ClassCourse ClassCourse { get; private set; } = null!;

    private Subject() { }

    public Subject(Guid id, string name, string code, Guid classCourseId, DateTime? createdAt = null, DateTime? updatedAt = null)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new DomainException("Subject name is required.");
        if (string.IsNullOrWhiteSpace(code)) throw new DomainException("Subject code is required.");
        if (classCourseId == Guid.Empty) throw new DomainException("Class course is required.");

        Id = id;
        Name = name;
        Code = code;
        ClassCourseId = classCourseId;
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

    public void Update(string? name, string? code, Guid? classCourseId)
    {
        var newName = name ?? Name;
        var newCode = code ?? Code;
        var newClassCourseId = classCourseId ?? ClassCourseId;

        if (string.IsNullOrWhiteSpace(newName)) throw new DomainException("Subject name is required.");
        if (string.IsNullOrWhiteSpace(newCode)) throw new DomainException("Subject code is required.");
        if (newClassCourseId == Guid.Empty) throw new DomainException("Class course is required.");

        Name = newName;
        Code = newCode;
        ClassCourseId = newClassCourseId;
        UpdatedAt = DateTime.UtcNow;
    }
}
using AMS.Domain.Shared;

namespace AMS.Domain.Entities;

public class Subject
{
    public Guid Id { get; private set; }
    public string Name { get; private set; }
    public string Code { get; private set; }
    public Guid ClassCourseId { get; private set; }

    private Subject() { }

    public Subject(Guid id, string name, string code, Guid classCourseId)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new DomainException("Subject name is required.");
        if (string.IsNullOrWhiteSpace(code)) throw new DomainException("Subject code is required.");

        Id = id;
        Name = name;
        Code = code;
        ClassCourseId = classCourseId;
    }
}

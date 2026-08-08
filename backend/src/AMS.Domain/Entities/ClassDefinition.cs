namespace AMS.Domain.Entities;

public class ClassDefinition
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;

    private ClassDefinition() { }

    public ClassDefinition(Guid id, string name)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Class name is required.");
        Id = id;
        Name = name;
    }
}

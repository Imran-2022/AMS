namespace AMS.Domain.Entities;

public class ClassDefinition
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!;
    public int SortOrder { get; private set; }

    private ClassDefinition() { }

    public ClassDefinition(Guid id, string name)
        : this(id, name, default)
    {
    }

    public ClassDefinition(Guid id, string name, int sortOrder)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Class name is required.");
        if (sortOrder < 0) throw new ArgumentException("Sort order must be zero or positive.", nameof(sortOrder));

        Id = id;
        Name = name;
        SortOrder = sortOrder;
    }
}

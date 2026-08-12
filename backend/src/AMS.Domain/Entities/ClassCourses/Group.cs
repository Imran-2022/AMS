namespace AMS.Domain.Entities;

public class Group
{
    public Guid Id { get; private set; }
    public Guid ClassDefinitionId { get; private set; }
    public ClassDefinition ClassDefinition { get; private set; } = null!;
    public string Name { get; private set; } = null!;

    private Group() { }

    public Group(Guid id, Guid classDefinitionId, string name)
    {
        if (classDefinitionId == Guid.Empty) throw new ArgumentException("ClassDefinitionId is required.");
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Group name is required.");

        Id = id;
        ClassDefinitionId = classDefinitionId;
        Name = name;
    }
}

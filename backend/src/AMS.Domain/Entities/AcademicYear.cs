namespace AMS.Domain.Entities;

public class AcademicYear
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = null!; // e.g., "2026-2027"
    public DateTime StartDate { get; private set; }
    public DateTime EndDate { get; private set; }
    public bool IsActive { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private AcademicYear() { }

    public AcademicYear(Guid id, string name, DateTime startDate, DateTime endDate, bool isActive = false)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Academic year name is required.");
        if (endDate <= startDate)
            throw new ArgumentException("End date must be after start date.");

        Id = id;
        Name = name;
        StartDate = startDate;
        EndDate = endDate;
        IsActive = isActive;
        CreatedAt = DateTime.UtcNow;
    }

    public void SetActive(bool isActive) => IsActive = isActive;

    public void Activate()
    {
        IsActive = true;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}

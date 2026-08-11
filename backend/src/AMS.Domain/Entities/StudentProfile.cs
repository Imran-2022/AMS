namespace AMS.Domain.Entities;

public class StudentProfile
{
    public Guid UserId { get; private set; }
    public string StudentId { get; private set; } = null!;
    public string GuardianName { get; private set; } = null!;
    public string GuardianEmail { get; private set; } = null!;
    public string ParentMobile { get; private set; } = null!;
    public DateTime AdmissionDate { get; private set; }

    public User User { get; private set; } = null!;

    private StudentProfile() { }

    public StudentProfile(Guid userId, string studentId, string guardianName, string guardianEmail, string parentMobile, DateTime admissionDate)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.");
        if (string.IsNullOrWhiteSpace(studentId)) throw new ArgumentException("StudentId is required.");
        if (string.IsNullOrWhiteSpace(guardianName)) throw new ArgumentException("Guardian name is required.");
        if (string.IsNullOrWhiteSpace(guardianEmail)) throw new ArgumentException("Guardian email is required.");
        if (string.IsNullOrWhiteSpace(parentMobile)) throw new ArgumentException("Parent mobile is required.");
        if (admissionDate == default) throw new ArgumentException("Admission date is required.");

        UserId = userId;
        StudentId = studentId;
        GuardianName = guardianName;
        GuardianEmail = guardianEmail;
        ParentMobile = parentMobile;
        AdmissionDate = admissionDate.Kind switch
        {
            DateTimeKind.Utc => admissionDate,
            DateTimeKind.Local => admissionDate.ToUniversalTime(),
            _ => DateTime.SpecifyKind(admissionDate, DateTimeKind.Utc)
        };
    }

    public void UpdateParentMobile(string parentMobile)
    {
        if (string.IsNullOrWhiteSpace(parentMobile)) throw new ArgumentException("Parent mobile is required.");
        ParentMobile = parentMobile;
    }
}

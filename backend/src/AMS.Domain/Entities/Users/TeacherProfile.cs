namespace AMS.Domain.Entities;

public class TeacherProfile
{
    public Guid UserId { get; private set; }
    public string EmployeeId { get; private set; } = null!;
    public string SubjectSpecialization { get; private set; } = null!;
    public string Qualification { get; private set; } = null!;
    public DateTime JoiningDate { get; private set; }

    public User User { get; private set; } = null!;

    private TeacherProfile() { }

    public TeacherProfile(Guid userId, string employeeId, string subjectSpecialization, string qualification, DateTime joiningDate)
    {
        if (userId == Guid.Empty) throw new ArgumentException("UserId is required.");
        if (string.IsNullOrWhiteSpace(employeeId)) throw new ArgumentException("EmployeeId is required.");
        if (string.IsNullOrWhiteSpace(subjectSpecialization)) throw new ArgumentException("Subject specialization is required.");
        if (string.IsNullOrWhiteSpace(qualification)) throw new ArgumentException("Qualification is required.");
        if (joiningDate == default) throw new ArgumentException("Joining date is required.");

        UserId = userId;
        EmployeeId = employeeId;
        SubjectSpecialization = subjectSpecialization;
        Qualification = qualification;
        JoiningDate = joiningDate.Kind switch
        {
            DateTimeKind.Utc => joiningDate,
            DateTimeKind.Local => joiningDate.ToUniversalTime(),
            _ => DateTime.SpecifyKind(joiningDate, DateTimeKind.Utc)
        };
    }
}

using AMS.Domain.Shared;

namespace AMS.Application.Contracts;

public class AdminDashboardStatsDto
{
    public int TotalUsers { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalStudents { get; set; }
    public int TotalClasses { get; set; }
    public int TotalSubjects { get; set; }
    public int TotalAssignments { get; set; }
    public int TotalSubmissions { get; set; }
}

public class TeacherDashboardStatsDto
{
    public int ActiveAssignmentsCount { get; set; }
    public int DraftAssignmentsCount { get; set; }
    public int PendingGradingSubmissionsCount { get; set; }
    public int TotalGradedSubmissionsCount { get; set; }
    public int AssignedSubjectsCount { get; set; }
}

public class StudentDashboardStatsDto
{
    public int EnrolledClassesCount { get; set; }
    public int ActiveAssignmentsCount { get; set; }
    public int SubmittedCount { get; set; }
    public int GradedCount { get; set; }
    public int UpcomingDeadlinesCount { get; set; }
}

public interface IDashboardAppService
{
    Task<AdminDashboardStatsDto> GetAdminStatsAsync();
    Task<TeacherDashboardStatsDto> GetTeacherStatsAsync(Guid teacherId);
    Task<StudentDashboardStatsDto> GetStudentStatsAsync(Guid studentId);
}

using AMS.Application.Contracts;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;

namespace AMS.Application.Services;

public class DashboardAppService : IDashboardAppService
{
    private readonly IUserRepository _userRepository;
    private readonly IClassCourseRepository _classCourseRepository;
    private readonly IGroupRepository _groupRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IStudentEnrollmentRepository _enrollmentRepository;
    private readonly ITeacherSubjectAssignmentRepository _teacherAssignmentRepository;

    public DashboardAppService(
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        IGroupRepository groupRepository,
        ISubjectRepository subjectRepository,
        IAssignmentRepository assignmentRepository,
        ISubmissionRepository submissionRepository,
        IStudentEnrollmentRepository enrollmentRepository,
        ITeacherSubjectAssignmentRepository teacherAssignmentRepository)
    {
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _groupRepository = groupRepository;
        _subjectRepository = subjectRepository;
        _assignmentRepository = assignmentRepository;
        _submissionRepository = submissionRepository;
        _enrollmentRepository = enrollmentRepository;
        _teacherAssignmentRepository = teacherAssignmentRepository;
    }

    public async Task<AdminDashboardStatsDto> GetAdminStatsAsync()
    {
        var users = await _userRepository.GetAllAsync();
        var classes = await _classCourseRepository.GetAllAsync();
        var subjects = await _subjectRepository.GetAllAsync();
        var assignments = await _assignmentRepository.GetAllAsync();
        var submissions = await _submissionRepository.GetAllAsync();

        return new AdminDashboardStatsDto
        {
            TotalUsers = users.Count,
            TotalTeachers = users.Count(u => u.Role == UserRole.Teacher),
            TotalStudents = users.Count(u => u.Role == UserRole.Student),
            TotalClasses = classes.Count,
            TotalSubjects = subjects.Count,
            TotalAssignments = assignments.Count,
            TotalSubmissions = submissions.Count
        };
    }

    public async Task<TeacherDashboardStatsDto> GetTeacherStatsAsync(Guid teacherId)
    {
        var assignments = await _assignmentRepository.GetByTeacherAsync(teacherId);
        var teacherSubjects = await _teacherAssignmentRepository.GetByTeacherAsync(teacherId);

        int activeCount = assignments.Count(a => a.Status == AssignmentStatus.Published);
        int draftCount = assignments.Count(a => a.Status == AssignmentStatus.Draft);

        int pendingGrading = 0;
        int gradedCount = 0;

        foreach (var assignment in assignments)
        {
            var submissions = await _submissionRepository.GetByAssignmentAsync(assignment.Id);
            pendingGrading += submissions.Count(s => s.Status == SubmissionStatus.Submitted || s.Status == SubmissionStatus.Late || s.Status == SubmissionStatus.UnderReview || s.Status == SubmissionStatus.Resubmitted);
            gradedCount += submissions.Count(s => s.Status == SubmissionStatus.Graded);
        }

        return new TeacherDashboardStatsDto
        {
            ActiveAssignmentsCount = activeCount,
            DraftAssignmentsCount = draftCount,
            PendingGradingSubmissionsCount = pendingGrading,
            TotalGradedSubmissionsCount = gradedCount,
            AssignedSubjectsCount = teacherSubjects.Count
        };
    }

    public async Task<StudentDashboardStatsDto> GetStudentStatsAsync(Guid studentId)
    {
        var student = await _userRepository.GetByIdAsync(studentId) ?? throw new DomainException("Student not found.");
        var enrollments = await _enrollmentRepository.GetByStudentAsync(studentId);
        var submissions = await _submissionRepository.GetByStudentAsync(studentId);

        var enrolledClasses = new List<Domain.Entities.ClassCourse>();
        foreach (var enrollment in enrollments)
        {
            var classCourse = await _classCourseRepository.GetByIdAsync(enrollment.ClassCourseId);
            if (classCourse is not null) enrolledClasses.Add(classCourse);
        }

        var enrolledClassIds = enrollments.Select(e => e.ClassCourseId).Distinct().ToList();
        var allAssignments = new List<Domain.Entities.Assignment>();

        foreach (var classId in enrolledClassIds)
        {
            var assignments = await _assignmentRepository.GetPublishedForClassAsync(classId);
            allAssignments.AddRange(assignments);
        }

        int submitted = submissions.Count(s => s.Status == SubmissionStatus.Submitted || s.Status == SubmissionStatus.Late || s.Status == SubmissionStatus.Resubmitted || s.Status == SubmissionStatus.UnderReview);
        int graded = submissions.Count(s => s.Status == SubmissionStatus.Graded);

        var now = DateTime.UtcNow;
        int upcoming = allAssignments.Count(a => a.Deadline > now);

        return new StudentDashboardStatsDto
        {
            StudentName = student.FullName,
            StudentId = student.StudentId,
            Role = student.Role.ToString(),
            ClassName = enrolledClasses.FirstOrDefault()?.Name ?? string.Empty,
            ClassSection = enrolledClasses.FirstOrDefault()?.Section ?? string.Empty,
            GroupName = enrolledClasses.FirstOrDefault()?.GroupId is Guid groupId
                ? (await _groupRepository.GetByIdAsync(groupId))?.Name
                : null,
            AcademicYear = enrolledClasses.FirstOrDefault()?.AcademicYear?.Name ?? string.Empty,
            EnrolledClassesCount = enrollments.Count,
            ActiveAssignmentsCount = allAssignments.Count,
            SubmittedCount = submitted,
            GradedCount = graded,
            UpcomingDeadlinesCount = upcoming
        };
    }
}

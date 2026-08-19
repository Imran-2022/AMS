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
    private readonly IAcademicYearRepository _academicYearRepository;

    public DashboardAppService(
        IUserRepository userRepository,
        IClassCourseRepository classCourseRepository,
        IGroupRepository groupRepository,
        ISubjectRepository subjectRepository,
        IAssignmentRepository assignmentRepository,
        ISubmissionRepository submissionRepository,
        IStudentEnrollmentRepository enrollmentRepository,
        ITeacherSubjectAssignmentRepository teacherAssignmentRepository,
        IAcademicYearRepository academicYearRepository)
    {
        _userRepository = userRepository;
        _classCourseRepository = classCourseRepository;
        _groupRepository = groupRepository;
        _subjectRepository = subjectRepository;
        _assignmentRepository = assignmentRepository;
        _submissionRepository = submissionRepository;
        _enrollmentRepository = enrollmentRepository;
        _teacherAssignmentRepository = teacherAssignmentRepository;
        _academicYearRepository = academicYearRepository;
    }

    public async Task<AdminDashboardStatsDto> GetAdminStatsAsync(Guid? academicYearId = null)
    {
        var selectedYear = academicYearId.HasValue
            ? await _academicYearRepository.GetByIdAsync(academicYearId.Value)
            : await _academicYearRepository.GetActiveAsync();

        var yearToUse = selectedYear ?? await _academicYearRepository.GetActiveAsync();

        var users = await _userRepository.GetAllAsync();
        var allClasses = await _classCourseRepository.GetAllAsync();
        var allSubjects = await _subjectRepository.GetAllAsync();
        var allAssignments = await _assignmentRepository.GetAllAsync();
        var allSubmissions = await _submissionRepository.GetAllAsync();

        var classes = yearToUse is null
            ? allClasses
            : allClasses.Where(c => c.AcademicYearId == yearToUse.Id).ToList();

        var classIds = classes.Select(c => c.Id).ToHashSet();
        var subjects = yearToUse is null
            ? allSubjects
            : allSubjects.Where(s => classIds.Contains(s.ClassCourseId)).ToList();

        var subjectIds = subjects.Select(s => s.Id).ToHashSet();
        var assignments = allAssignments
            .Where(a => subjectIds.Contains(a.SubjectId) && a.Status == AssignmentStatus.Published)
            .ToList();

        var assignmentIds = assignments.Select(a => a.Id).ToHashSet();
        var submissions = allSubmissions.Where(s => assignmentIds.Contains(s.AssignmentId)).ToList();

        var teacherCount = yearToUse is null
            ? users.Count(u => u.Role == UserRole.Teacher)
            : (await _teacherAssignmentRepository.GetAllAsync())
                .Where(assignment =>
                {
                    var subject = allSubjects.FirstOrDefault(s => s.Id == assignment.SubjectId);
                    if (subject is null) return false;
                    var classCourse = allClasses.FirstOrDefault(c => c.Id == subject.ClassCourseId);
                    return classCourse is not null && classCourse.AcademicYearId == yearToUse.Id;
                })
                .Select(x => x.TeacherId)
                .Distinct()
                .Count();

        var studentCount = yearToUse is null
            ? users.Count(u => u.Role == UserRole.Student)
            : (await _enrollmentRepository.GetByAcademicYearAsync(yearToUse.Id))
                .Select(x => x.StudentId)
                .Distinct()
                .Count();

        return new AdminDashboardStatsDto
        {
            AcademicYear = yearToUse?.Name ?? string.Empty,
            TotalUsers = users.Count,
            TotalTeachers = teacherCount,
            TotalStudents = studentCount,
            TotalClasses = classes.Count,
            TotalSubjects = subjects.Count,
            TotalAssignments = assignments.Count,
            TotalSubmissions = submissions.Count
        };
    }

    public async Task<TeacherDashboardStatsDto> GetTeacherStatsAsync(Guid teacherId)
    {
        var activeYear = await _academicYearRepository.GetActiveAsync();

        var assignments = await _assignmentRepository.GetByTeacherAsync(teacherId);
        var teacherSubjects = await _teacherAssignmentRepository.GetByTeacherAsync(teacherId);

        if (activeYear is not null)
        {
            var filteredAssignments = new List<Domain.Entities.Assignment>();
            foreach (var assignment in assignments)
            {
                var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId);
                if (subject is null) continue;
                var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId);
                if (classCourse is not null && classCourse.AcademicYearId == activeYear.Id)
                {
                    filteredAssignments.Add(assignment);
                }
            }
            assignments = filteredAssignments;

            var filteredTeacherSubjects = new List<Domain.Entities.TeacherSubjectAssignment>();
            foreach (var assignment in teacherSubjects)
            {
                var subject = await _subjectRepository.GetByIdAsync(assignment.SubjectId);
                if (subject is null) continue;
                var classCourse = await _classCourseRepository.GetByIdAsync(subject.ClassCourseId);
                if (classCourse is not null && classCourse.AcademicYearId == activeYear.Id)
                {
                    filteredTeacherSubjects.Add(assignment);
                }
            }
            teacherSubjects = filteredTeacherSubjects;
        }

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
            AcademicYear = activeYear?.Name ?? string.Empty,
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
        var activeYear = await _academicYearRepository.GetActiveAsync();

        var enrollments = activeYear is null
            ? await _enrollmentRepository.GetByStudentAsync(studentId)
            : await _enrollmentRepository.GetByStudentAndAcademicYearAsync(studentId, activeYear.Id);

        // If no enrollments in active year, fall back to latest enrollment from any year
        if (enrollments.Count == 0 && activeYear is not null)
        {
            var allEnrollments = await _enrollmentRepository.GetByStudentAsync(studentId);
            enrollments = allEnrollments.OrderByDescending(e => e.EnrolledAt).Take(1).ToList();
        }

        var enrolledClasses = new List<Domain.Entities.ClassCourse>();
        foreach (var enrollment in enrollments)
        {
            var classCourse = await _classCourseRepository.GetByIdAsync(enrollment.ClassCourseId);
            if (classCourse is not null)
            {
                enrolledClasses.Add(classCourse);
            }
        }

        var enrolledClassIds = enrollments
            .Select(e => e.ClassCourseId)
            .Distinct()
            .ToHashSet();

        var allAssignments = new List<Domain.Entities.Assignment>();
        foreach (var classId in enrolledClassIds)
        {
            var assignments = await _assignmentRepository.GetPublishedForClassAsync(classId);
            allAssignments.AddRange(assignments);
        }

        var assignmentIdsInScope = allAssignments.Select(a => a.Id).ToHashSet();
        var submissions = (await _submissionRepository.GetByStudentAsync(studentId))
            .Where(s => assignmentIdsInScope.Contains(s.AssignmentId))
            .ToList();

        int submitted = submissions.Count(s => s.Status == SubmissionStatus.Submitted || s.Status == SubmissionStatus.Late || s.Status == SubmissionStatus.Resubmitted || s.Status == SubmissionStatus.UnderReview);
        int graded = submissions.Count(s => s.Status == SubmissionStatus.Graded);

        var now = DateTime.UtcNow;
        int upcoming = allAssignments.Count(a => a.Deadline > now);

        var currentClass = enrolledClasses.FirstOrDefault();

        return new StudentDashboardStatsDto
        {
            StudentName = student.FullName,
            StudentId = student.StudentId,
            Role = student.Role.ToString(),
            ClassName = currentClass?.Name ?? string.Empty,
            ClassSection = currentClass?.Section ?? string.Empty,
            GroupName = currentClass?.GroupId is Guid groupId
                ? (await _groupRepository.GetByIdAsync(groupId))?.Name
                : null,
            AcademicYear = activeYear?.Name ?? string.Empty,
            EnrolledClassesCount = enrollments.Count,
            ActiveAssignmentsCount = allAssignments.Count,
            SubmittedCount = submitted,
            GradedCount = graded,
            UpcomingDeadlinesCount = upcoming
        };
    }
}

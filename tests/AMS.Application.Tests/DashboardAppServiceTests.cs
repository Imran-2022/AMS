using AMS.Application.Services;
using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Moq;
using Xunit;

namespace AMS.Application.Tests;

public class DashboardAppServiceTests
{
    [Fact]
    public async Task GetAdminStatsAsync_Should_Return_Correct_Counts()
    {
        var users = new List<User>
        {
            new User(Guid.NewGuid(), "Admin", "admin@example.com", "hash", UserRole.Admin),
            new User(Guid.NewGuid(), "Teacher", "teacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Student", "student@example.com", "hash", UserRole.Student)
        };
        var classes = new[] { new ClassCourse(Guid.NewGuid(), "Class", "A", Guid.NewGuid(), Guid.NewGuid()) };
        var subjects = new[] { new Subject(Guid.NewGuid(), "Math", "MATH101", classes[0].Id) };
        var assignments = new[] { new Assignment(Guid.NewGuid(), "Title", "Desc", subjects[0].Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(1), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow) };
        var submissions = new[] { new Submission(Guid.NewGuid(), assignments[0].Id, Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted) };

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(classes);

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(subjects);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(assignments);

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(submissions);

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync((AcademicYear?)null);

        var service = new DashboardAppService(userRepo.Object, classRepo.Object, Mock.Of<IGroupRepository>(), subjectRepo.Object, assignmentRepo.Object, submissionRepo.Object, enrollmentRepo.Object, teacherAssignmentRepo.Object, academicYearRepo.Object);

        var stats = await service.GetAdminStatsAsync();

        Assert.Equal(3, stats.TotalUsers);
        Assert.Equal(1, stats.TotalTeachers);
        Assert.Equal(1, stats.TotalStudents);
        Assert.Equal(1, stats.TotalClasses);
        Assert.Equal(1, stats.TotalSubjects);
        Assert.Equal(1, stats.TotalAssignments);
        Assert.Equal(1, stats.TotalSubmissions);
    }

    [Fact]
    public async Task GetAdminStatsAsync_Should_Filter_By_Active_Academic_Year()
    {
        var activeYear = new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(300), true);
        var otherYear = new AcademicYear(Guid.NewGuid(), "2025-2026", DateTime.UtcNow.AddDays(-200), DateTime.UtcNow.AddDays(-20), false);

        var activeClass = new ClassCourse(Guid.NewGuid(), "Class 7", "A", activeYear.Id, Guid.NewGuid());
        var oldClass = new ClassCourse(Guid.NewGuid(), "Class 6", "A", otherYear.Id, Guid.NewGuid());

        var activeSubject = new Subject(Guid.NewGuid(), "Math", "MATH101", activeClass.Id);
        var oldSubject = new Subject(Guid.NewGuid(), "History", "HIST101", oldClass.Id);

        var activeAssignment = new Assignment(Guid.NewGuid(), "Current Year Assignment", "Desc", activeSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);
        var oldAssignment = new Assignment(Guid.NewGuid(), "Old Assignment", "Desc", oldSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var users = new List<User>
        {
            new User(Guid.NewGuid(), "Admin", "admin@example.com", "hash", UserRole.Admin),
            new User(Guid.NewGuid(), "Current Teacher", "teacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Old Teacher", "oldteacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Current Student", "student@example.com", "hash", UserRole.Student),
            new User(Guid.NewGuid(), "Old Student", "oldstudent@example.com", "hash", UserRole.Student)
        };

        var activeEnrollment = new StudentEnrollment(users[3].Id, activeClass.Id, activeYear.Id, "01");
        var oldEnrollment = new StudentEnrollment(users[4].Id, oldClass.Id, otherYear.Id, "02");

        var activeSubmission = new Submission(Guid.NewGuid(), activeAssignment.Id, users[3].Id, "content", DateTime.UtcNow, false, SubmissionStatus.Submitted);
        var oldSubmission = new Submission(Guid.NewGuid(), oldAssignment.Id, users[4].Id, "content", DateTime.UtcNow, false, SubmissionStatus.Submitted);

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeClass, oldClass });
        classRepo.Setup(r => r.GetByAcademicYearAsync(activeYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeClass });

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeSubject, oldSubject });
        subjectRepo.Setup(r => r.GetByAcademicYearAsync(activeYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeSubject });

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeAssignment, oldAssignment });

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeSubmission, oldSubmission });

        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        teacherAssignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new TeacherSubjectAssignment(users[1].Id, activeSubject.Id),
            new TeacherSubjectAssignment(users[2].Id, oldSubject.Id)
        });

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        enrollmentRepo.Setup(r => r.GetByAcademicYearAsync(activeYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeEnrollment });

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(users);

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(activeYear);

        var service = new DashboardAppService(userRepo.Object, classRepo.Object, Mock.Of<IGroupRepository>(), subjectRepo.Object, assignmentRepo.Object, submissionRepo.Object, enrollmentRepo.Object, teacherAssignmentRepo.Object, academicYearRepo.Object);

        var stats = await service.GetAdminStatsAsync();

        Assert.Equal(1, stats.TotalClasses);
        Assert.Equal(1, stats.TotalSubjects);
        Assert.Equal(1, stats.TotalAssignments);
        Assert.Equal(1, stats.TotalSubmissions);
        Assert.Equal(1, stats.TotalTeachers);
        Assert.Equal(1, stats.TotalStudents);
    }

    [Fact]
    public async Task GetAdminStatsAsync_Should_Filter_By_Selected_Academic_Year_Id()
    {
        var activeYear = new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(300), true);
        var previousYear = new AcademicYear(Guid.NewGuid(), "2025-2026", DateTime.UtcNow.AddDays(-200), DateTime.UtcNow.AddDays(-20), false);

        var activeClass = new ClassCourse(Guid.NewGuid(), "Class 7", "A", activeYear.Id, Guid.NewGuid());
        var previousClass = new ClassCourse(Guid.NewGuid(), "Class 6", "A", previousYear.Id, Guid.NewGuid());

        var activeSubject = new Subject(Guid.NewGuid(), "Math", "MATH101", activeClass.Id);
        var previousSubject = new Subject(Guid.NewGuid(), "History", "HIST101", previousClass.Id);

        var activeAssignment = new Assignment(Guid.NewGuid(), "Current Year Assignment", "Desc", activeSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);
        var previousAssignment = new Assignment(Guid.NewGuid(), "Previous Year Assignment", "Desc", previousSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        userRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new List<User>
        {
            new User(Guid.NewGuid(), "Admin", "admin@example.com", "hash", UserRole.Admin),
            new User(Guid.NewGuid(), "Current Teacher", "teacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Previous Teacher", "oldteacher@example.com", "hash", UserRole.Teacher),
            new User(Guid.NewGuid(), "Current Student", "student@example.com", "hash", UserRole.Student),
            new User(Guid.NewGuid(), "Previous Student", "oldstudent@example.com", "hash", UserRole.Student)
        });

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeClass, previousClass });

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeSubject, previousSubject });

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeAssignment, previousAssignment });

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new Submission(Guid.NewGuid(), activeAssignment.Id, Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted),
            new Submission(Guid.NewGuid(), previousAssignment.Id, Guid.NewGuid(), "content", DateTime.UtcNow, false, SubmissionStatus.Submitted)
        });

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        enrollmentRepo.Setup(r => r.GetByAcademicYearAsync(previousYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new StudentEnrollment(Guid.NewGuid(), previousClass.Id, previousYear.Id, "02")
        });

        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        teacherAssignmentRepo.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new TeacherSubjectAssignment(Guid.NewGuid(), activeSubject.Id),
            new TeacherSubjectAssignment(Guid.NewGuid(), previousSubject.Id)
        });

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetByIdAsync(previousYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(previousYear);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(activeYear);

        var service = new DashboardAppService(
            userRepo.Object,
            classRepo.Object,
            Mock.Of<IGroupRepository>(),
            subjectRepo.Object,
            assignmentRepo.Object,
            submissionRepo.Object,
            enrollmentRepo.Object,
            teacherAssignmentRepo.Object,
            academicYearRepo.Object);

        var stats = await service.GetAdminStatsAsync(previousYear.Id);

        Assert.Equal("2025-2026", stats.AcademicYear);
        Assert.Equal(1, stats.TotalClasses);
        Assert.Equal(1, stats.TotalSubjects);
        Assert.Equal(1, stats.TotalAssignments);
        Assert.Equal(1, stats.TotalSubmissions);
    }

    [Fact]
    public async Task GetStudentStatsAsync_Should_Use_Active_Academic_Year_Only()
    {
        var activeYear = new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(300), true);
        var previousYear = new AcademicYear(Guid.NewGuid(), "2025-2026", DateTime.UtcNow.AddDays(-200), DateTime.UtcNow.AddDays(-20), false);

        var activeClass = new ClassCourse(Guid.NewGuid(), "Class 7", "A", activeYear.Id, Guid.NewGuid());
        var previousClass = new ClassCourse(Guid.NewGuid(), "Class 6", "A", previousYear.Id, Guid.NewGuid());
        var studentId = Guid.NewGuid();

        var student = new User(
            studentId,
            "Jane Student",
            "jane@example.com",
            "hash",
            UserRole.Student,
            studentProfile: new StudentProfile(studentId, "ST-2026", "Guardian Name", "guardian@example.com", "1234567890", DateTime.UtcNow.AddYears(-1)));

        var activeEnrollment = new StudentEnrollment(student.Id, activeClass.Id, activeYear.Id, "08");
        var previousEnrollment = new StudentEnrollment(student.Id, previousClass.Id, previousYear.Id, "06");

        var studentUserRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        studentUserRepo.Setup(r => r.GetByIdAsync(student.Id, It.IsAny<CancellationToken>())).ReturnsAsync(student);

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetByIdAsync(activeClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(activeClass);
        classRepo.Setup(r => r.GetByIdAsync(previousClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(previousClass);

        var groupRepo = new Mock<IGroupRepository>(MockBehavior.Strict);

        var activeSubject = new Subject(Guid.NewGuid(), "Math", "MATH101", activeClass.Id);
        var previousSubject = new Subject(Guid.NewGuid(), "Science", "SCI101", previousClass.Id);
        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(activeSubject.Id, It.IsAny<CancellationToken>())).ReturnsAsync(activeSubject);
        subjectRepo.Setup(r => r.GetByIdAsync(previousSubject.Id, It.IsAny<CancellationToken>())).ReturnsAsync(previousSubject);

        var activeAssignment = new Assignment(Guid.NewGuid(), "Current Year Assignment", "Desc", activeSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);
        var previousAssignment = new Assignment(Guid.NewGuid(), "Old Year Assignment", "Desc", previousSubject.Id, Guid.NewGuid(), DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetPublishedForClassAsync(activeClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeAssignment });
        assignmentRepo.Setup(r => r.GetPublishedForClassAsync(previousClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { previousAssignment });

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetByStudentAsync(student.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new Submission(Guid.NewGuid(), activeAssignment.Id, student.Id, "done", DateTime.UtcNow, false, SubmissionStatus.Submitted),
            new Submission(Guid.NewGuid(), previousAssignment.Id, student.Id, "done old", DateTime.UtcNow, false, SubmissionStatus.Submitted)
        });

        var enrollmentRepo = new Mock<IStudentEnrollmentRepository>(MockBehavior.Strict);
        enrollmentRepo.Setup(r => r.GetByStudentAsync(student.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeEnrollment, previousEnrollment });
        enrollmentRepo.Setup(r => r.GetByStudentAndAcademicYearAsync(student.Id, activeYear.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeEnrollment });

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(activeYear);

        var service = new DashboardAppService(
            studentUserRepo.Object,
            classRepo.Object,
            groupRepo.Object,
            subjectRepo.Object,
            assignmentRepo.Object,
            submissionRepo.Object,
            enrollmentRepo.Object,
            Mock.Of<ITeacherSubjectAssignmentRepository>(),
            academicYearRepo.Object);

        var stats = await service.GetStudentStatsAsync(student.Id);

        Assert.Equal("Class 7", stats.ClassName);
        Assert.Equal("A", stats.ClassSection);
        Assert.Equal("2026-2027", stats.AcademicYear);
        Assert.Equal(1, stats.EnrolledClassesCount);
        Assert.Equal(1, stats.ActiveAssignmentsCount);
    }

    [Fact]
    public async Task GetTeacherStatsAsync_Should_Use_Active_Academic_Year_Only()
    {
        var activeYear = new AcademicYear(Guid.NewGuid(), "2026-2027", DateTime.UtcNow.AddDays(-10), DateTime.UtcNow.AddDays(300), true);
        var previousYear = new AcademicYear(Guid.NewGuid(), "2025-2026", DateTime.UtcNow.AddDays(-200), DateTime.UtcNow.AddDays(-20), false);

        var teacherId = Guid.NewGuid();
        var activeClass = new ClassCourse(Guid.NewGuid(), "Class 7", "A", activeYear.Id, Guid.NewGuid());
        var previousClass = new ClassCourse(Guid.NewGuid(), "Class 6", "A", previousYear.Id, Guid.NewGuid());

        var activeSubject = new Subject(Guid.NewGuid(), "Math", "MATH101", activeClass.Id);
        var previousSubject = new Subject(Guid.NewGuid(), "History", "HIST101", previousClass.Id);

        var activeAssignment = new Assignment(Guid.NewGuid(), "Current Year Assignment", "Desc", activeSubject.Id, teacherId, DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);
        var previousAssignment = new Assignment(Guid.NewGuid(), "Old Year Assignment", "Desc", previousSubject.Id, teacherId, DateTime.UtcNow.AddDays(3), 100, AssignmentStatus.Published, true, true, DateTime.UtcNow);

        var assignmentRepo = new Mock<IAssignmentRepository>(MockBehavior.Strict);
        assignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>())).ReturnsAsync(new[] { activeAssignment, previousAssignment });

        var subjectRepo = new Mock<ISubjectRepository>(MockBehavior.Strict);
        subjectRepo.Setup(r => r.GetByIdAsync(activeSubject.Id, It.IsAny<CancellationToken>())).ReturnsAsync(activeSubject);
        subjectRepo.Setup(r => r.GetByIdAsync(previousSubject.Id, It.IsAny<CancellationToken>())).ReturnsAsync(previousSubject);

        var classRepo = new Mock<IClassCourseRepository>(MockBehavior.Strict);
        classRepo.Setup(r => r.GetByIdAsync(activeClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(activeClass);
        classRepo.Setup(r => r.GetByIdAsync(previousClass.Id, It.IsAny<CancellationToken>())).ReturnsAsync(previousClass);

        var teacherAssignmentRepo = new Mock<ITeacherSubjectAssignmentRepository>(MockBehavior.Strict);
        teacherAssignmentRepo.Setup(r => r.GetByTeacherAsync(teacherId, It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new TeacherSubjectAssignment(teacherId, activeSubject.Id),
            new TeacherSubjectAssignment(teacherId, previousSubject.Id)
        });

        var submissionRepo = new Mock<ISubmissionRepository>(MockBehavior.Strict);
        submissionRepo.Setup(r => r.GetByAssignmentAsync(activeAssignment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new Submission(Guid.NewGuid(), activeAssignment.Id, Guid.NewGuid(), "current", DateTime.UtcNow, false, SubmissionStatus.Submitted)
        });
        submissionRepo.Setup(r => r.GetByAssignmentAsync(previousAssignment.Id, It.IsAny<CancellationToken>())).ReturnsAsync(new[]
        {
            new Submission(Guid.NewGuid(), previousAssignment.Id, Guid.NewGuid(), "old", DateTime.UtcNow, false, SubmissionStatus.Submitted)
        });

        var academicYearRepo = new Mock<IAcademicYearRepository>(MockBehavior.Strict);
        academicYearRepo.Setup(r => r.GetActiveAsync(It.IsAny<CancellationToken>())).ReturnsAsync(activeYear);

        var service = new DashboardAppService(
            Mock.Of<IUserRepository>(),
            classRepo.Object,
            Mock.Of<IGroupRepository>(),
            subjectRepo.Object,
            assignmentRepo.Object,
            submissionRepo.Object,
            Mock.Of<IStudentEnrollmentRepository>(),
            teacherAssignmentRepo.Object,
            academicYearRepo.Object);

        var stats = await service.GetTeacherStatsAsync(teacherId);

        Assert.Equal(1, stats.ActiveAssignmentsCount);
        Assert.Equal(1, stats.AssignedSubjectsCount);
        Assert.Equal(1, stats.PendingGradingSubmissionsCount);
    }
}

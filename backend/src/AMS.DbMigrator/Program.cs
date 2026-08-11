using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using AMS.EntityFrameworkCore;
using AMS.EntityFrameworkCore.Repositories;
using BCrypt.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = Host.CreateDefaultBuilder(args)
    .ConfigureAppConfiguration((context, config) =>
    {
        config.AddJsonFile("appsettings.json", optional: true);
        config.AddEnvironmentVariables();
    })
    .ConfigureServices((context, services) =>
    {
        var connectionString = context.Configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=amsdb;Username=postgres;Password=root";

        services.AddDbContext<AmsDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IAcademicYearRepository, AcademicYearRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IClassCourseRepository, ClassCourseRepository>();
        services.AddScoped<IClassDefinitionRepository, ClassDefinitionRepository>();
        services.AddScoped<IGroupRepository, GroupRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();
        services.AddScoped<IAssignmentRepository, AssignmentRepository>();
        services.AddScoped<ISubmissionRepository, SubmissionRepository>();
        services.AddScoped<ITeacherSubjectAssignmentRepository, TeacherSubjectAssignmentRepository>();
        services.AddScoped<IStudentEnrollmentRepository, StudentEnrollmentRepository>();
    });

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var dbContext = scope.ServiceProvider.GetRequiredService<AmsDbContext>();
await dbContext.Database.MigrateAsync();

var academicYearRepo = scope.ServiceProvider.GetRequiredService<IAcademicYearRepository>();
var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
var classRepo = scope.ServiceProvider.GetRequiredService<IClassCourseRepository>();
var classDefRepo = scope.ServiceProvider.GetRequiredService<IClassDefinitionRepository>();
var groupRepo = scope.ServiceProvider.GetRequiredService<IGroupRepository>();
var subjectRepo = scope.ServiceProvider.GetRequiredService<ISubjectRepository>();
var assignmentRepo = scope.ServiceProvider.GetRequiredService<IAssignmentRepository>();
var submissionRepo = scope.ServiceProvider.GetRequiredService<ISubmissionRepository>();
var teacherAssignmentRepo = scope.ServiceProvider.GetRequiredService<ITeacherSubjectAssignmentRepository>();
var enrollmentRepo = scope.ServiceProvider.GetRequiredService<IStudentEnrollmentRepository>();

// Seed Academic Years
var academicYears = await academicYearRepo.GetAllAsync(CancellationToken.None);
if (academicYears.Count == 0)
{
    var fy2027 = new AcademicYear(Guid.NewGuid(), "2026-2027", new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: true);
    var fy2028 = new AcademicYear(Guid.NewGuid(), "2025-2026", new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: false);

    await academicYearRepo.AddAsync(fy2027, CancellationToken.None);
    await academicYearRepo.AddAsync(fy2028, CancellationToken.None);
}

// Refresh academic years after potential seeding
academicYears = await academicYearRepo.GetAllAsync(CancellationToken.None);
var defaultAcademicYear = academicYears.FirstOrDefault(a => a.IsActive) ?? academicYears.First();

var adminExists = await userRepo.GetByEmailAsync("admin@ams.local", CancellationToken.None);
if (adminExists is null)
{
    var adminId = Guid.NewGuid();
    await userRepo.AddAsync(new User(adminId, "System Admin", "admin@ams.local", BCrypt.Net.BCrypt.HashPassword("Admin123!"), UserRole.Admin));
}

var teacherExists = await userRepo.GetByEmailAsync("teacher@ams.local", CancellationToken.None);
if (teacherExists is null)
{
    var t1Id = Guid.NewGuid();
    var t1Profile = new TeacherProfile(t1Id, "EMP-1001", "Mathematics", "MSc", DateTime.UtcNow);
    await userRepo.AddAsync(new User(t1Id, "Ava Teacher", "teacher@ams.local", BCrypt.Net.BCrypt.HashPassword("Teacher123!"), UserRole.Teacher, teacherProfile: t1Profile));

    var t2Id = Guid.NewGuid();
    var t2Profile = new TeacherProfile(t2Id, "EMP-1002", "Science", "MSc", DateTime.UtcNow);
    await userRepo.AddAsync(new User(t2Id, "Ben Teacher", "teacher2@ams.local", BCrypt.Net.BCrypt.HashPassword("Teacher123!"), UserRole.Teacher, teacherProfile: t2Profile));
}

var studentExists = await userRepo.GetByEmailAsync("student@ams.local", CancellationToken.None);
if (studentExists is null)
{
    var s1Id = Guid.NewGuid();
    var s1Profile = new StudentProfile(s1Id, "S-1001", "Mina's Parent", "parent1@example.com", "1234567890", DateTime.UtcNow);
    await userRepo.AddAsync(new User(s1Id, "Mina Student", "student@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student, studentProfile: s1Profile));

    var s2Id = Guid.NewGuid();
    var s2Profile = new StudentProfile(s2Id, "S-1002", "Noah's Parent", "parent2@example.com", "1234567891", DateTime.UtcNow);
    await userRepo.AddAsync(new User(s2Id, "Noah Student", "student2@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student, studentProfile: s2Profile));

    var s3Id = Guid.NewGuid();
    var s3Profile = new StudentProfile(s3Id, "S-1003", "Omar's Parent", "parent3@example.com", "1234567892", DateTime.UtcNow);
    await userRepo.AddAsync(new User(s3Id, "Omar Student", "student3@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student, studentProfile: s3Profile));
}

var classDefinitions = await classDefRepo.GetAllAsync(CancellationToken.None);
var classNames = new[] { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve" };
var missingClassNames = classNames.Except(classDefinitions.Select(cd => cd.Name)).ToList();

if (missingClassNames.Any())
{
    var definitionsToAdd = missingClassNames
        .Select(name => new ClassDefinition(Guid.NewGuid(), name, Array.IndexOf(classNames, name) + 1))
        .ToList();

    foreach (var classDef in definitionsToAdd)
    {
        await classDefRepo.AddAsync(classDef, CancellationToken.None);
    }

    classDefinitions = await classDefRepo.GetAllAsync(CancellationToken.None);
}

// Ensure default groups exist for higher-secondary classes (9-12) regardless of existing class courses
var higherSecondaryDefinitions = classDefinitions.Where(cd => new[] { "Nine", "Ten", "Eleven", "Twelve" }.Contains(cd.Name)).ToList();
foreach (var classDefinition in higherSecondaryDefinitions)
{
    var existingGroups = await groupRepo.GetByClassDefinitionAsync(classDefinition.Id, CancellationToken.None);
    var defaultGroups = new[] { "Science", "Arts", "Commerce" };
    foreach (var groupName in defaultGroups)
    {
        if (existingGroups.All(g => g.Name != groupName))
        {
            await groupRepo.AddAsync(new Group(Guid.NewGuid(), classDefinition.Id, groupName), CancellationToken.None);
        }
    }
}

var classCourse = await classRepo.GetAllAsync(CancellationToken.None);
if (classCourse.Count == 0)
{
    var seededDefinitions = classDefinitions.Where(cd => classNames.Contains(cd.Name)).ToList();
    Guid? scienceGroupId = null;

    var elevenDef = seededDefinitions.FirstOrDefault(c => c.Name == "Eleven");
    if (elevenDef is not null)
    {
        scienceGroupId = (await groupRepo.GetByClassDefinitionAsync(elevenDef.Id, CancellationToken.None)).FirstOrDefault(g => g.Name == "Science")?.Id;
    }

    var orderedDefinitions = classNames
        .Select(name => seededDefinitions.FirstOrDefault(cd => cd.Name == name))
        .Where(cd => cd is not null)
        .Cast<ClassDefinition>()
        .ToList();

    var seededCourses = orderedDefinitions
        .Select((classDef, index) => new ClassCourse(
            Guid.NewGuid(),
            classDef.Name,
            index % 2 == 0 ? "A" : "B",
            defaultAcademicYear.Id,
            classDef.Id,
            classDef.Name == "Eleven" ? scienceGroupId : null))
        .ToList();

    foreach (var course in seededCourses)
    {
        await classRepo.AddAsync(course, CancellationToken.None);
    }

    var oneCourse = seededCourses.FirstOrDefault(c => c.Name == "One");
    if (oneCourse is not null)
    {
        var math = new Subject(Guid.NewGuid(), "Mathematics", "MATH101", oneCourse.Id);
        await subjectRepo.AddAsync(math, CancellationToken.None);

        var teacher = await userRepo.GetByEmailAsync("teacher@ams.local", CancellationToken.None);
        if (teacher is not null)
        {
            await teacherAssignmentRepo.AddAsync(new TeacherSubjectAssignment(teacher.Id, math.Id, oneCourse.Id), CancellationToken.None);
        }

        var student = await userRepo.GetByEmailAsync("student@ams.local", CancellationToken.None);
        if (student is not null)
        {
            await enrollmentRepo.AddAsync(new StudentEnrollment(student.Id, oneCourse.Id), CancellationToken.None);
        }

        if (teacher is not null && student is not null)
        {
            var assignment = new Assignment(Guid.NewGuid(), "Algebra Basics", "Complete the algebra worksheet.", oneCourse.Id, math.Id, teacher.Id, DateTime.UtcNow.AddDays(7), 100, AssignmentStatus.Published, false, true, DateTime.UtcNow);
            await assignmentRepo.AddAsync(assignment, CancellationToken.None);

            var submission = new Submission(Guid.NewGuid(), assignment.Id, student.Id, "Completed worksheet.", null, null, DateTime.UtcNow, false, SubmissionStatus.Submitted);
            await submissionRepo.AddAsync(submission, CancellationToken.None);
        }
    }
}

Console.WriteLine("Seeding completed.");

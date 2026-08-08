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

var adminExists = await userRepo.GetByEmailAsync("admin@ams.local", CancellationToken.None);
if (adminExists is null)
{
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "System Admin", "admin@ams.local", BCrypt.Net.BCrypt.HashPassword("Admin123!"), UserRole.Admin));
}

var teacherExists = await userRepo.GetByEmailAsync("teacher@ams.local", CancellationToken.None);
if (teacherExists is null)
{
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "Ava Teacher", "teacher@ams.local", BCrypt.Net.BCrypt.HashPassword("Teacher123!"), UserRole.Teacher));
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "Ben Teacher", "teacher2@ams.local", BCrypt.Net.BCrypt.HashPassword("Teacher123!"), UserRole.Teacher));
}

var studentExists = await userRepo.GetByEmailAsync("student@ams.local", CancellationToken.None);
if (studentExists is null)
{
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "Mina Student", "student@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student));
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "Noah Student", "student2@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student));
    await userRepo.AddAsync(new AppUser(Guid.NewGuid(), "Omar Student", "student3@ams.local", BCrypt.Net.BCrypt.HashPassword("Student123!"), UserRole.Student));
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

var classCourse = await classRepo.GetAllAsync(CancellationToken.None);
if (classCourse.Count == 0)
{
    var seededDefinitions = classDefinitions.Where(cd => classNames.Contains(cd.Name)).ToList();
    Guid? scienceGroupId = null;

    var elevenDef = seededDefinitions.FirstOrDefault(c => c.Name == "Eleven");
    if (elevenDef is not null)
    {
        var groups = await groupRepo.GetByClassDefinitionAsync(elevenDef.Id, CancellationToken.None);
        scienceGroupId = groups.FirstOrDefault(g => g.Name == "Science")?.Id;

        if (scienceGroupId is null)
        {
            var scienceGroup = new Group(Guid.NewGuid(), elevenDef.Id, "Science");
            await groupRepo.AddAsync(scienceGroup, CancellationToken.None);
            scienceGroupId = scienceGroup.Id;
        }
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
            "2026-2027",
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
            var assignment = new Assignment(Guid.NewGuid(), "Algebra Basics", "Complete the algebra worksheet.", oneCourse.Id, math.Id, teacher.Id, DateTime.UtcNow.AddDays(7), 100, AssignmentStatus.Published, true, false, DateTime.UtcNow);
            await assignmentRepo.AddAsync(assignment, CancellationToken.None);

            var submission = new Submission(Guid.NewGuid(), assignment.Id, student.Id, "Completed worksheet.", null, DateTime.UtcNow, false, SubmissionStatus.Submitted);
            await submissionRepo.AddAsync(submission, CancellationToken.None);
        }
    }
}

Console.WriteLine("Seeding completed.");

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
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IClassCourseRepository, ClassCourseRepository>();
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

var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
var classRepo = scope.ServiceProvider.GetRequiredService<IClassCourseRepository>();
var subjectRepo = scope.ServiceProvider.GetRequiredService<ISubjectRepository>();
var assignmentRepo = scope.ServiceProvider.GetRequiredService<IAssignmentRepository>();
var submissionRepo = scope.ServiceProvider.GetRequiredService<ISubmissionRepository>();
var teacherAssignmentRepo = scope.ServiceProvider.GetRequiredService<ITeacherSubjectAssignmentRepository>();
var enrollmentRepo = scope.ServiceProvider.GetRequiredService<IStudentEnrollmentRepository>();

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

var classCourse = await classRepo.GetAllAsync(CancellationToken.None);
if (classCourse.Count == 0)
{
    var grade10 = new ClassCourse(Guid.NewGuid(), "Grade 10", "A", "2026-2027");
    var grade11 = new ClassCourse(Guid.NewGuid(), "Grade 11", "B", "2026-2027");
    await classRepo.AddAsync(grade10, CancellationToken.None);
    await classRepo.AddAsync(grade11, CancellationToken.None);

    var math = new Subject(Guid.NewGuid(), "Mathematics", "MATH101", grade10.Id);
    var science = new Subject(Guid.NewGuid(), "Science", "SCI101", grade11.Id);
    await subjectRepo.AddAsync(math, CancellationToken.None);
    await subjectRepo.AddAsync(science, CancellationToken.None);

    var teacher = await userRepo.GetByEmailAsync("teacher@ams.local", CancellationToken.None);
    if (teacher is not null)
    {
        await teacherAssignmentRepo.AddAsync(new TeacherSubjectAssignment(teacher.Id, math.Id, grade10.Id), CancellationToken.None);
    }

    var student = await userRepo.GetByEmailAsync("student@ams.local", CancellationToken.None);
    if (student is not null)
    {
        await enrollmentRepo.AddAsync(new StudentEnrollment(student.Id, grade10.Id), CancellationToken.None);
    }

    var assignment = new Assignment(Guid.NewGuid(), "Algebra Basics", "Complete the algebra worksheet.", grade10.Id, math.Id, teacher!.Id, DateTime.UtcNow.AddDays(7), 100, AssignmentStatus.Published, true, false, DateTime.UtcNow);
    await assignmentRepo.AddAsync(assignment, CancellationToken.None);

    var submission = new Submission(Guid.NewGuid(), assignment.Id, student!.Id, "Completed worksheet.", null, DateTime.UtcNow, false, SubmissionStatus.Submitted);
    await submissionRepo.AddAsync(submission, CancellationToken.None);
}

Console.WriteLine("Seeding completed.");

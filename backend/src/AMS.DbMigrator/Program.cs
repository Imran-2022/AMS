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
            ?? "Host=localhost;Port=5432;Database=amsdb1;Username=postgres;Password=root";

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
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationPreferenceRepository, NotificationPreferenceRepository>();
    });

using var host = builder.Build();
using var scope = host.Services.CreateScope();
var dbContext = scope.ServiceProvider.GetRequiredService<AmsDbContext>();
await dbContext.Database.MigrateAsync();

// await AMSSeeder.SeedAsync(scope.ServiceProvider);

// Seed class definitions
await ClassDefinitionSeeder.SeedAsync(scope.ServiceProvider);
await GroupSeeder.SeedAsync(scope.ServiceProvider);
// Seed academic years
await AcademicYearSeeder.SeedAsync(scope.ServiceProvider);
// Seed only admin user
await AdminUserSeeder.SeedAsync(scope.ServiceProvider);

Console.WriteLine("Seeding completed.");


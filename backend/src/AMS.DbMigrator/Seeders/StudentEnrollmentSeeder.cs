using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Enrolls the 3 seeded students into representative ClassCourses so the
/// full class -> section -> group -> enrollment flow is populated end to
/// end, covering both a non-grouped lower class and grouped higher classes:
///
///   student@gmail.com  -> Class Six,  Section A            (no group)
///   student2@gmail.com -> Class Ten,  Section A / Science
///   student3@gmail.com -> Class Nine, Section B / Arts
/// </summary>
public static class StudentEnrollmentSeeder
{
    private static readonly (string Email, string ClassName, string Section, string? GroupName)[] Plan =
    {
        ("student@gmail.com", "Six", "A", null),
        ("student2@gmail.com", "Ten", "A", "Science"),
        ("student3@gmail.com", "Nine", "B", "Arts"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var classRepo = sp.GetRequiredService<IClassCourseRepository>();
        var enrollmentRepo = sp.GetRequiredService<IStudentEnrollmentRepository>();
        var ct = CancellationToken.None;

        var classCourses = await classRepo.GetAllAsync(ct);

        foreach (var (email, className, section, groupName) in Plan)
        {
            var student = await userRepo.GetByEmailAsync(email, ct);
            if (student is null)
            {
                Console.WriteLine($"StudentEnrollmentSeeder: student '{email}' not found, skipping.");
                continue;
            }

            var targetCourse = classCourses.FirstOrDefault(c =>
                string.Equals(c.Name, className, StringComparison.OrdinalIgnoreCase) &&
                string.Equals(c.Section, section, StringComparison.OrdinalIgnoreCase) &&
                (groupName is null
                    ? c.GroupId is null
                    : c.Group is not null && string.Equals(c.Group.Name, groupName, StringComparison.OrdinalIgnoreCase)));

            if (targetCourse is null)
            {
                Console.WriteLine($"StudentEnrollmentSeeder: class course '{className} {section} {groupName}' not found, skipping.");
                continue;
            }

            var existing = await enrollmentRepo.GetAsync(student.Id, targetCourse.Id, ct);
            if (existing is not null) continue;

            await enrollmentRepo.AddAsync(new StudentEnrollment(student.Id, targetCourse.Id, isActive: true, enrolledAt: DateTime.UtcNow), ct);
        }
    }
}

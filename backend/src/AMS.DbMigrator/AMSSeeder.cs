using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

/// <summary>
/// Orchestrates all seeders in the correct dependency order:
///
///   1. AcademicYear                      (no dependencies)
///   2. ClassDefinition                   (no dependencies)
///   3. Group                             (depends on ClassDefinition)
///   4. ClassCourse                       (depends on AcademicYear, ClassDefinition, Group)
///   5. Subject                           (depends on ClassCourse)
///   6. User (Admin/Teachers/Students)    (no dependencies)
///   7. TeacherSubjectAssignment          (depends on User [teachers], Subject)
///   8. StudentEnrollment                 (depends on User [students], ClassCourse)
///
/// Assignments, Submissions, and Attachments are intentionally NOT seeded -
/// those are meant to be created through normal app usage / testing.
/// </summary>
public static class AMSSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        await AcademicYearSeeder.SeedAsync(sp);
        await ClassDefinitionSeeder.SeedAsync(sp);
        await GroupSeeder.SeedAsync(sp);
        await ClassCourseSeeder.SeedAsync(sp);
        await SubjectSeeder.SeedAsync(sp);
        await UserSeeder.SeedAsync(sp);
        await TeacherSubjectAssignmentSeeder.SeedAsync(sp);
        await StudentEnrollmentSeeder.SeedAsync(sp);

        Console.WriteLine("Seeding (modular) completed.");
    }
}

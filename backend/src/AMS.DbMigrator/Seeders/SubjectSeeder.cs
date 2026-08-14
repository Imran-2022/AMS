using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Seeds Subjects for every ClassCourse with a deliberately minimal curriculum:
///
///  - Classes One..Eight   -> exactly 3 subjects: Bangla, English, Mathematics.
///  - Classes Nine..Twelve -> exactly 3 subjects: Bangla, English, + 1 subject
///    that depends on the ClassCourse's Group:
///       Science  -> Physics
///       Arts     -> Economics
///       Commerce -> Accounting
///
/// Every ClassCourse ends up with exactly 3 subjects. Subject.Code is unique
/// per ClassCourse (matches the DB unique index on (class_course_id, code)).
///
/// Idempotent: adds whatever is missing from the template. It also removes
/// subjects that don't belong to the current template (e.g. left over from
/// an earlier, richer version of this seeder) -- but ONLY when that subject
/// has zero real usage (no Assignments created against it). Subject.Code ->
/// Assignment.SubjectId cascade-deletes Assignments -> Submissions, so a
/// subject with actual coursework attached is deliberately left alone and
/// just logged, instead of being silently wiped along with everything a
/// teacher/student did with it. This makes it safe to run the same seeder
/// against a database that already has real usage data, not just an empty
/// dev database.
/// </summary>
public static class SubjectSeeder
{
    private static readonly string[] LowerClasses = { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight" };

    private static readonly (string Name, string Code)[] LowerClassSubjects =
    {
        ("Bangla", "BAN"),
        ("English", "ENG"),
        ("Mathematics", "MATH"),
    };

    private static readonly (string Name, string Code)[] CompulsorySubjects =
    {
        ("Bangla", "BAN"),
        ("English", "ENG"),
    };

    private static readonly Dictionary<string, (string Name, string Code)> GroupSubject = new()
    {
        ["Science"] = ("Physics", "PHY"),
        ["Arts"] = ("Economics", "ECO"),
        ["Commerce"] = ("Accounting", "ACC"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var classRepo = sp.GetRequiredService<IClassCourseRepository>();
        var subjectRepo = sp.GetRequiredService<ISubjectRepository>();
        var assignmentRepo = sp.GetRequiredService<IAssignmentRepository>();
        var ct = CancellationToken.None;

        var classCourses = await classRepo.GetAllAsync(ct);

        // Subjects that already have at least one real Assignment against them
        // must never be auto-deleted, no matter what the current template says.
        var subjectIdsWithAssignments = (await assignmentRepo.GetAllAsync(ct))
            .Select(a => a.SubjectId)
            .ToHashSet();

        foreach (var course in classCourses)
        {
            var isLower = LowerClasses.Contains(course.Name);

            (string Name, string Code)[] template;
            if (isLower)
            {
                template = LowerClassSubjects;
            }
            else if (course.Group is not null && GroupSubject.TryGetValue(course.Group.Name, out var groupSpecific))
            {
                template = CompulsorySubjects.Append(groupSpecific).ToArray();
            }
            else
            {
                template = CompulsorySubjects;
            }

            var existingSubjects = await subjectRepo.GetByClassCourseIdAsync(course.Id, ct);
            var templateCodes = template.Select(t => t.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Add anything missing from the template.
            var existingCodes = existingSubjects.Select(s => s.Code).ToHashSet(StringComparer.OrdinalIgnoreCase);
            foreach (var (name, code) in template)
            {
                if (existingCodes.Contains(code)) continue;
                await subjectRepo.AddAsync(new Subject(Guid.NewGuid(), name, code, course.Id), ct);
            }

            // Remove anything that's no longer part of the (simplified) template,
            // e.g. leftovers from an earlier richer curriculum -- but never touch
            // a subject that already has real Assignments (and therefore possibly
            // Submissions/grades) against it. Those are left in place and just
            // logged, so real usage data is never silently destroyed by a reseed.
            foreach (var stale in existingSubjects.Where(s => !templateCodes.Contains(s.Code)))
            {
                if (subjectIdsWithAssignments.Contains(stale.Id))
                {
                    Console.WriteLine(
                        $"SubjectSeeder: '{stale.Name}' ({stale.Code}) on {course.Name} {course.Section} " +
                        "is outside the current template but has real assignments attached — skipping deletion.");
                    continue;
                }

                await subjectRepo.DeleteAsync(stale.Id, ct);
            }
        }
    }
}

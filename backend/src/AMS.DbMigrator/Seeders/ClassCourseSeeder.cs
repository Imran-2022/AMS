using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Seeds ClassCourse records (Class + Section [+ Group]) for the active academic year.
///
/// Layout requested:
///  - Classes One .. Eight  -> exactly 1 section ("A"), no group.
///  - Classes Nine .. Twelve -> exactly 3 sections ("A", "B", "C"), each section
///    paired 1:1 with one of the 3 groups (Science, Arts, Commerce) so that
///    Section A = Science, Section B = Arts, Section C = Commerce.
///
/// This gives:
///   8 classes x 1 section          =  8 ClassCourses
///   4 classes x 3 sections/groups  = 12 ClassCourses
///   Total                          = 20 ClassCourses
/// </summary>
public static class ClassCourseSeeder
{
    private static readonly string[] LowerClasses = { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight" };
    private static readonly string[] HigherClasses = { "Nine", "Ten", "Eleven", "Twelve" };

    // Section -> Group name pairing for classes Nine..Twelve
    private static readonly (string Section, string GroupName)[] HigherSectionGroupMap =
    {
        ("A", "Science"),
        ("B", "Arts"),
        ("C", "Commerce"),
    };

    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var classDefRepo = sp.GetRequiredService<IClassDefinitionRepository>();
        var groupRepo = sp.GetRequiredService<IGroupRepository>();
        var classRepo = sp.GetRequiredService<IClassCourseRepository>();
        var academicRepo = sp.GetRequiredService<IAcademicYearRepository>();
        var ct = CancellationToken.None;

        var academicYears = await academicRepo.GetAllAsync(ct);
        var activeYear = academicYears.FirstOrDefault(a => a.IsActive) ?? academicYears.FirstOrDefault();
        if (activeYear is null)
        {
            Console.WriteLine("ClassCourseSeeder: no academic year found, skipping.");
            return;
        }

        var classDefs = await classDefRepo.GetAllAsync(ct);
        var existingCourses = (await classRepo.GetAllAsync(ct)).ToList();

        bool AlreadyExists(Guid classDefinitionId, Guid? groupId, string section)
            => existingCourses.Any(c =>
                c.ClassDefinitionId == classDefinitionId &&
                c.AcademicYearId == activeYear.Id &&
                c.GroupId == groupId &&
                string.Equals(c.Section, section, StringComparison.OrdinalIgnoreCase));

        // --- Classes One..Eight: single section "A", no group ---
        foreach (var def in classDefs.Where(d => LowerClasses.Contains(d.Name)))
        {
            if (AlreadyExists(def.Id, null, "A")) continue;

            var course = new ClassCourse(Guid.NewGuid(), def.Name, "A", activeYear.Id, def.Id, null);
            await classRepo.AddAsync(course, ct);
            existingCourses.Add(course);
        }

        // --- Classes Nine..Twelve: 3 sections, each paired with a group ---
        foreach (var def in classDefs.Where(d => HigherClasses.Contains(d.Name)))
        {
            var groups = await groupRepo.GetByClassDefinitionAsync(def.Id, ct);

            foreach (var (section, groupName) in HigherSectionGroupMap)
            {
                var group = groups.FirstOrDefault(g => string.Equals(g.Name, groupName, StringComparison.OrdinalIgnoreCase));
                if (group is null)
                {
                    Console.WriteLine($"ClassCourseSeeder: group '{groupName}' not found for class '{def.Name}', skipping section {section}.");
                    continue;
                }

                if (AlreadyExists(def.Id, group.Id, section)) continue;

                var course = new ClassCourse(Guid.NewGuid(), def.Name, section, activeYear.Id, def.Id, group.Id);
                await classRepo.AddAsync(course, ct);
                existingCourses.Add(course);
            }
        }
    }
}

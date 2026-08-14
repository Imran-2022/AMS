using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Assigns every seeded Subject to one of the two seeded Teachers, so the full
/// class -> section -> group -> subject -> teacher chain is populated end to
/// end. Assignment is deterministic (ordered by class sort order, then
/// section, then subject code) and alternates between the two teachers, so
/// re-running the seeder never changes existing assignments or creates
/// duplicates.
/// </summary>
public static class TeacherSubjectAssignmentSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var classRepo = sp.GetRequiredService<IClassCourseRepository>();
        var subjectRepo = sp.GetRequiredService<ISubjectRepository>();
        var classDefRepo = sp.GetRequiredService<IClassDefinitionRepository>();
        var assignmentRepo = sp.GetRequiredService<ITeacherSubjectAssignmentRepository>();
        var ct = CancellationToken.None;

        var teacher1 = await userRepo.GetByEmailAsync("teacher@gmail.com", ct);
        var teacher2 = await userRepo.GetByEmailAsync("teacher2@gmail.com", ct);
        if (teacher1 is null || teacher2 is null)
        {
            Console.WriteLine("TeacherSubjectAssignmentSeeder: teacher accounts not found, skipping.");
            return;
        }

        var teachers = new[] { teacher1, teacher2 };

        var classDefs = (await classDefRepo.GetAllAsync(ct)).ToDictionary(d => d.Id, d => d.SortOrder);
        var classCourses = (await classRepo.GetAllAsync(ct))
            .OrderBy(c => classDefs.TryGetValue(c.ClassDefinitionId, out var order) ? order : int.MaxValue)
            .ThenBy(c => c.Section, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var allSubjects = (await subjectRepo.GetAllAsync(ct)).ToList();
        var subjectsByClassCourse = allSubjects
            .GroupBy(s => s.ClassCourseId)
            .ToDictionary(g => g.Key, g => g.OrderBy(s => s.Code, StringComparer.OrdinalIgnoreCase).ToList());

        var existingAssignments = await assignmentRepo.GetAllAsync(ct);
        var existingSubjectIds = existingAssignments.Select(a => a.SubjectId).ToHashSet();

        var orderedSubjects = classCourses
            .Where(c => subjectsByClassCourse.ContainsKey(c.Id))
            .SelectMany(c => subjectsByClassCourse[c.Id])
            .ToList();

        var index = 0;
        foreach (var subject in orderedSubjects)
        {
            if (existingSubjectIds.Contains(subject.Id))
            {
                // Keep the deterministic index moving so future re-runs stay stable
                // even if some assignments already exist from a previous run.
                index++;
                continue;
            }

            var teacher = teachers[index % teachers.Length];
            await assignmentRepo.AddAsync(new TeacherSubjectAssignment(teacher.Id, subject.Id), ct);
            index++;
        }
    }
}

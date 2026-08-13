using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public static class ClassCourseSeeder
{
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
        if (activeYear is null) return;

        var classDefs = await classDefRepo.GetAllAsync(ct);
        var existingCourses = await classRepo.GetAllAsync(ct);
        if (existingCourses.Count > 0) return;

        foreach (var def in classDefs.OrderBy(d => d.SortOrder))
        {
            var course = new ClassCourse(Guid.NewGuid(), def.Name, "A", activeYear.Id, def.Id, null);
            await classRepo.AddAsync(course, ct);
        }
    }
}

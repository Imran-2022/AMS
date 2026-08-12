using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public static class ClassDefinitionSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var repo = sp.GetRequiredService<IClassDefinitionRepository>();
        var ct = CancellationToken.None;

        var classNames = new[] { "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve" };
        var existing = await repo.GetAllAsync(ct);
        var missing = classNames.Except(existing.Select(e => e.Name)).ToList();
        foreach (var name in missing)
        {
            var def = new ClassDefinition(Guid.NewGuid(), name, Array.IndexOf(classNames, name) + 1);
            await repo.AddAsync(def, ct);
        }
    }
}

using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public static class GroupSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var classDefRepo = sp.GetRequiredService<IClassDefinitionRepository>();
        var groupRepo = sp.GetRequiredService<IGroupRepository>();
        var ct = CancellationToken.None;

        var higher = (await classDefRepo.GetAllAsync(ct)).Where(cd => new[] { "Nine", "Ten", "Eleven", "Twelve" }.Contains(cd.Name)).ToList();
        var defaultGroups = new[] { "Science", "Arts", "Commerce" };
        foreach (var cd in higher)
        {
            var existing = await groupRepo.GetByClassDefinitionAsync(cd.Id, ct);
            foreach (var g in defaultGroups)
            {
                if (existing.All(x => x.Name != g))
                {
                    await groupRepo.AddAsync(new Group(Guid.NewGuid(), cd.Id, g), ct);
                }
            }
        }
    }
}

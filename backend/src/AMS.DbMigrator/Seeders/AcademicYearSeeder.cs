using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;

public static class AcademicYearSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var repo = sp.GetRequiredService<IAcademicYearRepository>();
        var ct = CancellationToken.None;

        var existing = await repo.GetAllAsync(ct);
        if (existing.Count == 0)
        {
            var fy2026 = new AcademicYear(Guid.NewGuid(), "2025-2026", new DateTime(2025, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: false);
            var fy2027 = new AcademicYear(Guid.NewGuid(), "2026-2027", new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc), new DateTime(2027, 8, 31, 23, 59, 59, DateTimeKind.Utc), isActive: true);
            await repo.AddAsync(fy2026, ct);
            await repo.AddAsync(fy2027, ct);
        }
    }
}

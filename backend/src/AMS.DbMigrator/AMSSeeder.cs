using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using AMS.EntityFrameworkCore.Repositories;
using BCrypt.Net;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public static class AMSSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;

        // Delegate to focused seeders
        await AcademicYearSeeder.SeedAsync(sp);
        await ClassDefinitionSeeder.SeedAsync(sp);
        await GroupSeeder.SeedAsync(sp);
        await UserSeeder.SeedAsync(sp);
        await ClassCourseSeeder.SeedAsync(sp);
        Console.WriteLine("Seeding (modular) completed.");
    }
}

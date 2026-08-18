using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using BCrypt.Net;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading.Tasks;

/// <summary>
/// Seeds a single admin user with default credentials.
/// </summary>
public static class AdminUserSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var ct = System.Threading.CancellationToken.None;

        await EnsureAdminUserAsync(userRepo, ct);
    }

    private static async Task EnsureAdminUserAsync(IUserRepository userRepo, System.Threading.CancellationToken ct)
    {
        var email = "admin@example.com";
        var existing = await userRepo.GetByEmailAsync(email, ct);

        if (existing is null)
        {
            var adminUser = new User(
                id: Guid.NewGuid(),
                fullName: "Admin User",
                email: email,
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                role: UserRole.Admin,
                phoneNumber: "+1234567890",
                isActive: true,
                createdAt: DateTime.UtcNow
            );

            await userRepo.AddAsync(adminUser, ct);
            Console.WriteLine("Admin user seeded successfully.");
        }
    }
}

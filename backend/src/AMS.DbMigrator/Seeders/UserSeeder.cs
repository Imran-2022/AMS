using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using BCrypt.Net;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;

public static class UserSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var ct = CancellationToken.None;

        // Cleanup legacy example accounts we don't want
        var legacyEmails = new[] { "admin@ams.local", "teacher@ams.local", "student@ams.local", "student2@ams.local", "student3@ams.local" };
        foreach (var e in legacyEmails)
        {
            var u = await userRepo.GetByEmailAsync(e, ct);
            if (u is not null)
            {
                await userRepo.DeleteAsync(u.Id, ct);
            }
        }

        // Admin
        var admin = await userRepo.GetByEmailAsync("admin@gmail.com", ct);
        if (admin is null)
        {
            var id = Guid.NewGuid();
            await userRepo.AddAsync(new User(id, "admin", "admin@gmail.com", BCrypt.Net.BCrypt.HashPassword("admin"), UserRole.Admin, createdAt: DateTime.UtcNow), ct);
        }

        // Student
        var student = await userRepo.GetByEmailAsync("asif@gmail.com", ct);
        if (student is null)
        {
            var id = Guid.NewGuid();
            var studentProfile = new StudentProfile(id, "ASIF-1001", "Md Asif's Parent", "parent.asif@gmail.com", "0123456789", DateTime.UtcNow);
            await userRepo.AddAsync(new User(id, "md asif", "asif@gmail.com", BCrypt.Net.BCrypt.HashPassword("student"), UserRole.Student, createdAt: DateTime.UtcNow, studentProfile: studentProfile), ct);
        }

        // Teacher
        var teacher = await userRepo.GetByEmailAsync("imran@gmail.com", ct);
        if (teacher is null)
        {
            var id = Guid.NewGuid();
            var teacherProfile = new TeacherProfile(id, "EMP-IMRAN-1", "General", "BEd", DateTime.UtcNow);
            await userRepo.AddAsync(new User(id, "imran", "imran@gmail.com", BCrypt.Net.BCrypt.HashPassword("teacher"), UserRole.Teacher, createdAt: DateTime.UtcNow, teacherProfile: teacherProfile), ct);
        }
    }
}

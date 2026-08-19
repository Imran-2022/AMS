using AMS.Domain.Entities;
using AMS.Domain.Repositories;
using AMS.Domain.Shared;
using BCrypt.Net;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Threading;
using System.Threading.Tasks;

/// <summary>
/// Seeds the fixed set of demo/test accounts requested for the project:
///
///   Role       Email                 Password
///   Admin      admin@gmail.com       Admin123!
///   Teacher    teacher@gmail.com     Teacher123!
///   Teacher 2  teacher2@gmail.com    Teacher123!
///   Student    student@gmail.com     Student123!
///   Student 2  student2@gmail.com    Student123!
///   Student 3  student3@gmail.com    Student123!
///
/// Teacher/Student rows also get their respective TeacherProfile /
/// StudentProfile records populated so downstream seeders (subject
/// assignment, enrollment) and the app itself have full data to work with.
/// </summary>
public static class UserSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var sp = scope.ServiceProvider;
        var userRepo = sp.GetRequiredService<IUserRepository>();
        var ct = CancellationToken.None;

        // Cleanup legacy example accounts from earlier iterations of this seeder
        // so re-running never leaves stale/duplicate demo users behind.
        var legacyEmails = new[]
        {
            "admin@ams.local", "teacher@ams.local", "student@ams.local", "student2@ams.local", "student3@ams.local",
            "asif@gmail.com", "imran@gmail.com"
        };
        foreach (var e in legacyEmails)
        {
            var legacy = await userRepo.GetByEmailAsync(e, ct);
            if (legacy is not null)
            {
                await userRepo.DeleteAsync(legacy.Id, ct);
            }
        }

        // ---------------- Admin ----------------
        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            return new User(
                id,
                fullName: "System Administrator",
                email: "admin@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                role: UserRole.Admin,
                phoneNumber: "+8801700000001",
                gender: "Other",
                dateOfBirth: new DateTime(1985, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                address: "AMS Head Office, Dhaka",
                createdAt: DateTime.UtcNow);
        });

        // ---------------- Teachers ----------------
        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            var teacherProfile = new TeacherProfile(
                id,
                employeeId: "EMP-2027-0001",
                subjectSpecialization: "Mathematics & Higher Mathematics",
                qualification: "M.Sc in Mathematics, B.Ed",
                joiningDate: new DateTime(2022, 1, 10, 0, 0, 0, DateTimeKind.Utc));

            return new User(
                id,
                fullName: "Rahim Uddin",
                email: "teacher@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Teacher123!"),
                role: UserRole.Teacher,
                phoneNumber: "+8801700000002",
                gender: "Male",
                dateOfBirth: new DateTime(1988, 4, 12, 0, 0, 0, DateTimeKind.Utc),
                address: "Mirpur, Dhaka",
                createdAt: DateTime.UtcNow,
                teacherProfile: teacherProfile);
        });

        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            var teacherProfile = new TeacherProfile(
                id,
                employeeId: "EMP-2027-0002",
                subjectSpecialization: "English & Social Sciences",
                qualification: "M.A in English Literature, B.Ed",
                joiningDate: new DateTime(2021, 6, 1, 0, 0, 0, DateTimeKind.Utc));

            return new User(
                id,
                fullName: "Nusrat Jahan",
                email: "teacher2@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Teacher123!"),
                role: UserRole.Teacher,
                phoneNumber: "+8801700000003",
                gender: "Female",
                dateOfBirth: new DateTime(1990, 9, 23, 0, 0, 0, DateTimeKind.Utc),
                address: "Dhanmondi, Dhaka",
                createdAt: DateTime.UtcNow,
                teacherProfile: teacherProfile);
        });

        // ---------------- Students ----------------
        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            var studentProfile = new StudentProfile(
                id,
                studentId: "STU-0001",
                guardianName: "Karim Ahmed",
                guardianEmail: "guardian.karim@gmail.com",
                parentMobile: "+8801800000001",
                admissionDate: new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));

            return new User(
                id,
                fullName: "Tanvir Ahmed",
                email: "student@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Student123!"),
                role: UserRole.Student,
                phoneNumber: "+8801900000001",
                gender: "Male",
                dateOfBirth: new DateTime(2012, 3, 15, 0, 0, 0, DateTimeKind.Utc),
                address: "Uttara, Dhaka",
                createdAt: DateTime.UtcNow,
                studentProfile: studentProfile);
        });

        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            var studentProfile = new StudentProfile(
                id,
                studentId: "STU-0002",
                guardianName: "Salma Begum",
                guardianEmail: "guardian.salma@gmail.com",
                parentMobile: "+8801800000002",
                admissionDate: new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));

            return new User(
                id,
                fullName: "Farhana Islam",
                email: "student2@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Student123!"),
                role: UserRole.Student,
                phoneNumber: "+8801900000002",
                gender: "Female",
                dateOfBirth: new DateTime(2010, 7, 22, 0, 0, 0, DateTimeKind.Utc),
                address: "Banani, Dhaka",
                createdAt: DateTime.UtcNow,
                studentProfile: studentProfile);
        });

        await EnsureUserAsync(userRepo, ct, () =>
        {
            var id = Guid.NewGuid();
            var studentProfile = new StudentProfile(
                id,
                studentId: "STU-0003",
                guardianName: "Jamal Hossain",
                guardianEmail: "guardian.jamal@gmail.com",
                parentMobile: "+8801800000003",
                admissionDate: new DateTime(2026, 9, 1, 0, 0, 0, DateTimeKind.Utc));

            return new User(
                id,
                fullName: "Sabbir Hossain",
                email: "student3@gmail.com",
                passwordHash: BCrypt.Net.BCrypt.HashPassword("Student123!"),
                role: UserRole.Student,
                phoneNumber: "+8801900000003",
                gender: "Male",
                dateOfBirth: new DateTime(2011, 11, 5, 0, 0, 0, DateTimeKind.Utc),
                address: "Mohammadpur, Dhaka",
                createdAt: DateTime.UtcNow,
                studentProfile: studentProfile);
        });
    }

    private static async Task EnsureUserAsync(IUserRepository userRepo, CancellationToken ct, Func<User> factory)
    {
        var probe = factory();
        var existing = await userRepo.GetByEmailAsync(probe.Email, ct);
        if (existing is null)
        {
            await userRepo.AddAsync(probe, ct);
        }
    }
}

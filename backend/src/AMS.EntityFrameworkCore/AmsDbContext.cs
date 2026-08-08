using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace AMS.EntityFrameworkCore;

public class AmsDbContext : DbContext
{
    public AmsDbContext(DbContextOptions<AmsDbContext> options) : base(options)
    {
    }

    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<ClassCourse> ClassCourses => Set<ClassCourse>();
    public DbSet<ClassDefinition> ClassDefinitions => Set<ClassDefinition>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<TeacherSubjectAssignment> TeacherSubjectAssignments => Set<TeacherSubjectAssignment>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Submission> Submissions => Set<Submission>();
    public DbSet<Attachment> Attachments => Set<Attachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AmsDbContext).Assembly);
    }
}

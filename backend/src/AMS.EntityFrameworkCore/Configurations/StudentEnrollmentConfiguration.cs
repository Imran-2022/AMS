using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class StudentEnrollmentConfiguration : IEntityTypeConfiguration<StudentEnrollment>
{
    public void Configure(EntityTypeBuilder<StudentEnrollment> builder)
    {
        builder.ToTable("student_enrollments");
        builder.HasKey(x => new { x.StudentId, x.ClassCourseId });
        builder.Property(x => x.StudentId).HasColumnName("student_id").IsRequired();
        builder.Property(x => x.ClassCourseId).HasColumnName("class_course_id").IsRequired();

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<ClassCourse>()
            .WithMany()
            .HasForeignKey(x => x.ClassCourseId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

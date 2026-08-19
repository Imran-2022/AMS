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
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();

        builder.HasOne(x => x.Student)
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.ClassCourse)
            .WithMany()
            .HasForeignKey(x => x.ClassCourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.AcademicYear)
            .WithMany()
            .HasForeignKey(x => x.AcademicYearId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

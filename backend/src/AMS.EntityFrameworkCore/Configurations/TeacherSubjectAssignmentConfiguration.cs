using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class TeacherSubjectAssignmentConfiguration : IEntityTypeConfiguration<TeacherSubjectAssignment>
{
    public void Configure(EntityTypeBuilder<TeacherSubjectAssignment> builder)
    {
        builder.ToTable("teacher_subject_assignments");
        builder.HasKey(x => new { x.TeacherId, x.SubjectId });
        builder.Property(x => x.TeacherId).HasColumnName("teacher_id").IsRequired();
        builder.Property(x => x.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(x => x.ClassCourseId).HasColumnName("class_course_id").IsRequired();

        builder.HasOne(x => x.Teacher)
            .WithMany()
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

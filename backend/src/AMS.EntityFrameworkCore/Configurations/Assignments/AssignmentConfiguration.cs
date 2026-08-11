using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.ToTable("assignments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
        builder.Property(x => x.AttachmentUrl).HasColumnName("attachment_url").HasMaxLength(500);
        builder.Property(x => x.AttachmentName).HasColumnName("attachment_name").HasMaxLength(255);
        builder.Property(x => x.ClassCourseId).HasColumnName("class_course_id").IsRequired();
        builder.Property(x => x.SubjectId).HasColumnName("subject_id").IsRequired();
        builder.Property(x => x.TeacherId).HasColumnName("teacher_id").IsRequired();
        builder.Property(x => x.Deadline).HasColumnName("deadline").IsRequired();
        builder.Property(x => x.MaxMarks).HasColumnName("max_marks").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").IsRequired();
        builder.Property(x => x.AllowLateSubmission).HasColumnName("allow_late_submission").IsRequired();
        builder.Property(x => x.AllowResubmission).HasColumnName("allow_resubmission").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();

        builder.HasOne(x => x.ClassCourse)
            .WithMany()
            .HasForeignKey(x => x.ClassCourseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Subject)
            .WithMany()
            .HasForeignKey(x => x.SubjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Teacher)
            .WithMany()
            .HasForeignKey(x => x.TeacherId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class SubmissionConfiguration : IEntityTypeConfiguration<Submission>
{
    public void Configure(EntityTypeBuilder<Submission> builder)
    {
        builder.ToTable("submissions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AssignmentId).HasColumnName("assignment_id").IsRequired();
        builder.Property(x => x.StudentId).HasColumnName("student_id").IsRequired();
        builder.Property(x => x.ContentText).HasColumnName("content_text").HasMaxLength(4000);
        builder.Property(x => x.FileUrl).HasColumnName("file_url").HasMaxLength(500);
        builder.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255);
        builder.Property(x => x.SubmittedAt).HasColumnName("submitted_at").IsRequired();
        builder.Property(x => x.ResubmittedAt).HasColumnName("resubmitted_at");
        builder.Property(x => x.ResubmissionCount).HasColumnName("resubmission_count").IsRequired();
        builder.Property(x => x.IsLate).HasColumnName("is_late").IsRequired();
        builder.Property(x => x.Status).HasColumnName("status").IsRequired();
        builder.Property(x => x.Marks).HasColumnName("marks");
        builder.Property(x => x.Feedback).HasColumnName("feedback").HasMaxLength(2000);
        builder.Property(x => x.GradedByTeacherId).HasColumnName("graded_by_teacher_id");
        builder.Property(x => x.GradedAt).HasColumnName("graded_at");

        builder.HasOne<Assignment>()
            .WithMany()
            .HasForeignKey(x => x.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

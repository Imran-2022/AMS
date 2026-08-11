using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class StudentProfileConfiguration : IEntityTypeConfiguration<StudentProfile>
{
    public void Configure(EntityTypeBuilder<StudentProfile> builder)
    {
        builder.ToTable("student_profiles");
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.StudentId).HasColumnName("student_id").HasMaxLength(100).IsRequired();
        builder.Property(x => x.GuardianName).HasColumnName("guardian_name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.GuardianEmail).HasColumnName("guardian_email").HasMaxLength(200).IsRequired();
        builder.Property(x => x.ParentMobile).HasColumnName("parent_mobile").HasMaxLength(50).IsRequired();
        builder.Property(x => x.AdmissionDate).HasColumnName("admission_date").IsRequired();

        builder.HasOne(x => x.User)
            .WithOne(x => x.StudentProfile)
            .HasForeignKey<StudentProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.StudentId).IsUnique();
    }
}

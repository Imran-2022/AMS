using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class TeacherProfileConfiguration : IEntityTypeConfiguration<TeacherProfile>
{
    public void Configure(EntityTypeBuilder<TeacherProfile> builder)
    {
        builder.ToTable("teacher_profiles");
        builder.HasKey(x => x.UserId);
        builder.Property(x => x.UserId).HasColumnName("user_id");
        builder.Property(x => x.EmployeeId).HasColumnName("employee_id").HasMaxLength(50).IsRequired();
        builder.Property(x => x.SubjectSpecialization).HasColumnName("subject_specialization").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Qualification).HasColumnName("qualification").HasMaxLength(200).IsRequired();
        builder.Property(x => x.JoiningDate).HasColumnName("joining_date").IsRequired();

        builder.HasOne(x => x.User)
            .WithOne(x => x.TeacherProfile)
            .HasForeignKey<TeacherProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.EmployeeId).IsUnique();
    }
}

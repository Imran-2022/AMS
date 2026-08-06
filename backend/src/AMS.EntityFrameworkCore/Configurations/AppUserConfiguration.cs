using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("app_users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique();
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Role).HasColumnName("role").IsRequired();
        builder.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500).IsRequired(false);
        builder.Property(x => x.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.EmployeeId).HasColumnName("employee_id").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.SubjectSpecialization).HasColumnName("subject_specialization").HasMaxLength(200).IsRequired(false);
        builder.Property(x => x.Qualification).HasColumnName("qualification").HasMaxLength(200).IsRequired(false);
        builder.Property(x => x.GuardianName).HasColumnName("guardian_name").HasMaxLength(200).IsRequired(false);
        builder.Property(x => x.GuardianEmail).HasColumnName("guardian_email").HasMaxLength(200).IsRequired(false);
        builder.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).IsRequired(false);
        builder.Property(x => x.StudentId).HasColumnName("student_id").HasMaxLength(100).IsRequired(false);
        builder.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.DateOfBirth).HasColumnName("date_of_birth").IsRequired(false);
        builder.Property(x => x.AdmissionDate).HasColumnName("admission_date").IsRequired(false);
        builder.Property(x => x.JoiningDate).HasColumnName("joining_date").IsRequired(false);
        builder.Property(x => x.ParentMobile).HasColumnName("parent_mobile").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
    }
}

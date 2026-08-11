using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class AppUserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Email).HasColumnName("email").HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique();
        builder.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
        builder.Property(x => x.Role).HasColumnName("role").IsRequired();
        builder.HasIndex(x => x.Role).HasDatabaseName("IX_users_role");
        builder.Property(x => x.AvatarUrl).HasColumnName("avatar_url").HasMaxLength(500).IsRequired(false);
        builder.Property(x => x.PhoneNumber).HasColumnName("phone_number").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.Gender).HasColumnName("gender").HasMaxLength(50).IsRequired(false);
        builder.Property(x => x.DateOfBirth).HasColumnName("date_of_birth").IsRequired(false);
        builder.Property(x => x.Address).HasColumnName("address").HasMaxLength(500).IsRequired(false);
        builder.Property(x => x.IsActive).HasColumnName("is_active").IsRequired();
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired(false);

        builder.HasOne(x => x.TeacherProfile)
            .WithOne(x => x.User)
            .HasForeignKey<TeacherProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.StudentProfile)
            .WithOne(x => x.User)
            .HasForeignKey<StudentProfile>(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

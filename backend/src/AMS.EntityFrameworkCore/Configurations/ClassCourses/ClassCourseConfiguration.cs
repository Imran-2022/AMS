using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class ClassCourseConfiguration : IEntityTypeConfiguration<ClassCourse>
{
    public void Configure(EntityTypeBuilder<ClassCourse> builder)
    {
        builder.ToTable("class_courses");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.Section).HasColumnName("section").HasMaxLength(50).IsRequired();
        builder.Property(x => x.AcademicYearId).HasColumnName("academic_year_id").IsRequired();
        builder.Property(x => x.ClassDefinitionId).HasColumnName("class_definition_id").IsRequired();
        builder.Property(x => x.GroupId).HasColumnName("group_id");
        builder.Property(x => x.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsRequired(false);

        builder.HasOne(x => x.ClassDefinition)
            .WithMany()
            .HasForeignKey(x => x.ClassDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Group)
            .WithMany()
            .HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(x => x.AcademicYear)
            .WithMany()
            .HasForeignKey(x => x.AcademicYearId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.ClassDefinitionId, x.Name }).HasDatabaseName("IX_groups_class_definition_name");

        builder.HasIndex(x => new { x.ClassDefinitionId, x.GroupId, x.AcademicYearId, x.Section })
            .IsUnique()
            .HasDatabaseName("IX_class_courses_unique_combination");
    }
}

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
        builder.Property(x => x.AcademicYear).HasColumnName("academic_year").HasMaxLength(20).IsRequired();
    }
}

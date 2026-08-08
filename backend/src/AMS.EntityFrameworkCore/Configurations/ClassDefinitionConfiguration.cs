using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class ClassDefinitionConfiguration : IEntityTypeConfiguration<ClassDefinition>
{
    public void Configure(EntityTypeBuilder<ClassDefinition> builder)
    {
        builder.ToTable("class_definitions");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();
        builder.Property(x => x.SortOrder).HasColumnName("sort_order").IsRequired().HasDefaultValue(0);
    }
}

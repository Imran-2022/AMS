using AMS.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AMS.EntityFrameworkCore.Configurations;

public class GroupConfiguration : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> builder)
    {
        builder.ToTable("groups");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ClassDefinitionId).HasColumnName("class_definition_id");
        builder.Property(x => x.Name).HasColumnName("name").HasMaxLength(200).IsRequired();

        builder.HasOne(x => x.ClassDefinition)
            .WithMany()
            .HasForeignKey(x => x.ClassDefinitionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

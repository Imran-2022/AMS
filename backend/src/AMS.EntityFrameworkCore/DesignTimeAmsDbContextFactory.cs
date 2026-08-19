using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AMS.EntityFrameworkCore;

public class DesignTimeAmsDbContextFactory : IDesignTimeDbContextFactory<AmsDbContext>
{
    public AmsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AmsDbContext>();
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=amsdb1;Username=postgres;Password=root");
        return new AmsDbContext(optionsBuilder.Options);
    }
}

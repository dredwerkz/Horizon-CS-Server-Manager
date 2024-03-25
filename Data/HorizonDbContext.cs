using horizon.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace horizon.Data;

public class HorizonDbContext : DbContext
{
    public DbSet<Servers> Servers { get; set; }
    public DbSet<Teams> Teams { get; set; }
    public DbSet<Players> Players { get; set; }

    public HorizonDbContext(DbContextOptions<HorizonDbContext> options) : base(options)
    {
        // Need to build out some real context for this eventually, to match my postgres schema!
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Servers>().HasData(
            new Servers
            {
                ServerKey = "127.0.0.1:99999",
                CT = 0,
                TERRORIST = 0,
                Map = "de_unknown",
                Rounds = 0,
                Admin = false,
            });
    }
}
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
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Servers>(entity =>
        {
            entity.HasKey(s => s.ServerKey);
            entity.Property(s => s.ServerKey).HasMaxLength(50);
            entity.Property(s => s.Map).HasMaxLength(100);
            entity.Property(s => s.ScoreCt).HasDefaultValue(0);
            entity.Property(s => s.ScoreT).HasDefaultValue(0);
            entity.Property(s => s.Rounds).HasDefaultValue(0);
            entity.Property(s => s.Admin).HasDefaultValue(false);
        });

        modelBuilder.Entity<Teams>(entity =>
        {
            entity.Property(t => t.Name).HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<Players>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(100).IsRequired();
            entity.HasOne(p => p.Teams)
                .WithMany(t => t.Players)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(p => p.TeamId);
        });
    }
}

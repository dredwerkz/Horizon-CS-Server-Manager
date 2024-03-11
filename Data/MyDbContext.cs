using Microsoft.EntityFrameworkCore;

namespace horizon.Data;

public class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options) : base(options)
    {
        // Need to build out some real context for this eventually, to match my postgres schema!!
    }
}
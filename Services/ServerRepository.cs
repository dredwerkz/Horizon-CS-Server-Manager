using horizon.Data;
using horizon.Data.Models;
using horizon.Processors;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace horizon.Services;

public class ServerRepository
{
    private readonly IDbContextFactory<HorizonDbContext> _contextFactory;
    private readonly ILogger<ServerRepository> _logger;

    public ServerRepository(IDbContextFactory<HorizonDbContext> contextFactory, ILogger<ServerRepository> logger)
    {
        _contextFactory = contextFactory;
        _logger = logger;
    }

    public async Task UpsertServerDataAsync(UdpDataProcessor data)
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();
            var server = await context.Servers.FindAsync(data.ServerKey);

            if (server == null)
            {
                server = new Servers { ServerKey = data.ServerKey };
                context.Servers.Add(server);
                _logger.LogInformation("New server registered: {ServerKey}", data.ServerKey);
            }

            if (data.ScoreCt != null) server.ScoreCt = data.ScoreCt.Value;
            if (data.ScoreT != null) server.ScoreT = data.ScoreT.Value;
            if (data.Map != null) server.Map = data.Map;
            if (data.Rounds != null) server.Rounds = data.Rounds.Value;
            if (data.Admin != null) server.Admin = data.Admin.Value;

            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error upserting server data for {ServerKey}", data.ServerKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error upserting server data for {ServerKey}", data.ServerKey);
        }
    }

    public async Task UpdateAdminFlagAsync(string serverKey, bool flag)
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();
            var server = await context.Servers.FindAsync(serverKey);

            if (server == null)
            {
                server = new Servers { ServerKey = serverKey, Admin = flag };
                context.Servers.Add(server);
            }
            else
            {
                server.Admin = flag;
            }

            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            _logger.LogError(ex, "Database error updating admin flag for {ServerKey}", serverKey);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error updating admin flag for {ServerKey}", serverKey);
        }
    }

    public async Task<List<Servers>> GetAllServersAsync()
    {
        try
        {
            await using var context = await _contextFactory.CreateDbContextAsync();
            return await context.Servers.AsNoTracking().ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all servers");
            return new List<Servers>();
        }
    }
}

using System.Net.Sockets;
using System.Text;
using horizon.Processors;
using horizon.Services;

namespace horizon;

public class UdpServer : BackgroundService
{
    private readonly ServerRepository _repository;
    private readonly ILogger<UdpServer> _logger;

    public UdpServer(ServerRepository repository, ILogger<UdpServer> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("UDP server starting on port 12345");

        using var listener = new UdpClient(12345);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var result = await listener.ReceiveAsync(stoppingToken);
                var receivedData = Encoding.UTF8.GetString(result.Buffer);

                var processedData = new UdpDataProcessor(result.RemoteEndPoint, receivedData, _logger);

                if (processedData.HasParsedData)
                {
                    await _repository.UpsertServerDataAsync(processedData);
                    await WebSocketHandler.BroadcastUpdateAsync(processedData, _logger);
                }
            }
            catch (SocketException ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Socket error in UDP listener, retrying in 1 second");
                await Task.Delay(1000, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                _logger.LogError(ex, "Unexpected error processing UDP packet");
            }
        }

        _logger.LogInformation("UDP server stopped");
    }
}

using System.Net;
using System.Net.Sockets;
using System.Text;
using horizon.Processors;

namespace horizon;

public class UdpServer
{
    private readonly string _connectionString;

    public UdpServer(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async void Start()
    {
        using var listener = new UdpClient(12345);
        var serverKey = new IPEndPoint(IPAddress.Any, 12345);
        try
        {
            while
                (true)
            {
                var bytes = listener.Receive(ref serverKey);
                var receivedData = Encoding.UTF8.GetString(bytes);

                var processedUpdateData = new UdpDataProcessor(serverKey, receivedData, _connectionString);

                await Startup.BroadcastNewDataViaWebSocketAsync(processedUpdateData, true);
            }
        }
        catch (SocketException e)
        {
            Console.WriteLine(e.ToString());
            throw;
        }
    }
}
using System.Net;
using System.Net.Sockets;
using System.Text;
using horizon.Data;
using horizon.Processors;

namespace horizon;

public class UdpServer
{
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

                var processedUpdateData = new UdpDataProcessor(serverKey, receivedData);

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
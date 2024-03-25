using System.Net;
using System.Net.Sockets;
using System.Runtime.Serialization;
using System.Text;
using horizon.Processors;
using Newtonsoft.Json;
using NuGet.Protocol;

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
                (true) // Is this not gonna just blow out the console?? - No, cause this only runs once a serverKey is instanced.
            {
                var bytes = listener.Receive(ref serverKey);
                var receivedData = Encoding.UTF8.GetString(bytes);

                var processedUpdateData = new UdpDataProcessor(serverKey, receivedData);

                await Startup.BroadcastNewDataViaWebSocketAsync(processedUpdateData);
            }
        }
        catch (SocketException e)
        {
            Console.WriteLine(e.ToString());
            throw;
        }
    }
}
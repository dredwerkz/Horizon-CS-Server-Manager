using System.Net;
using System.Net.Sockets;
using System.Text;
using horizon.Processors;

namespace horizon;

public class UdpServer
{
    public void Start()
    {
        using var listener = new UdpClient(12345);
        var serverKey = new IPEndPoint(IPAddress.Any, 12345);
        try
        {
            while
                (true) // Is this not gonna just blow out the console?? - No, cause this only runs once a serverKey is instanced.
            {
                // Console.WriteLine("Waiting for Broadcast");
                var bytes = listener.Receive(ref serverKey);
                var receivedData = Encoding.UTF8.GetString(bytes);

                // TODO: Send receivedData through to a class that handles routing ---- okay then what do I want to do with it??
                // TODO: OK so building out an instanced processor with all the info I'd want to pass to either the db or clients
                var serverDataUpdate = new UdpDataProcessor(serverKey, receivedData);
            }
        }
        catch (SocketException e)
        {
            Console.WriteLine(e.ToString());
            throw;
        }
    }
}
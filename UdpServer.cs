using System.Net;
using System.Net.Sockets;
using System.Text;

namespace horizon;

public class UdpServer
{
    public void Start()
    {
        using var listener = new UdpClient(12345);
        var groupEp = new IPEndPoint(IPAddress.Any, 12345);
        try
        {
            while (true) // Is this not gonna just blow out the console?? - No, cause this only runs once a groupEp is instanced.
            {
                Console.WriteLine("Waiting for Broadcast");
                var bytes = listener.Receive(ref groupEp);
                var receivedData = Encoding.UTF8.GetString(bytes);
                Console.WriteLine(receivedData); // Don't actually do this in prod, security vulnerability
            }
        }
        catch (SocketException e)
        {
            Console.WriteLine(e.ToString());
            throw;
        }
    }
}
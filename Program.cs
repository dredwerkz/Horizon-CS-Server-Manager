namespace horizon;

// ReSharper disable once ClassNeverInstantiated.Global
public class Program
{
    public static void Main(string[] args)
    {
        /*var host = CreateWebHostBuilder(args).Build();

        var udpServer = host.Services.GetRequiredService<UdpServer>();

        udpServer.Start();

        host.Run();*/

        var udpServer = new UdpServer();
        var udpThread = new Thread(udpServer.Start);

        udpThread.Start();

        CreateWebHostBuilder(args).Build().Run();
    }

    private static IHostBuilder CreateWebHostBuilder(string[] args) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); });
}
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

        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json")
            .Build();

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        var serverUrls = configuration["Server:Urls"] ?? "http://0.0.0.0:5000";

        var udpServer = new UdpServer(connectionString);
        var udpThread = new Thread(udpServer.Start);

        udpThread.Start();

        CreateWebHostBuilder(args, serverUrls).Build().Run();
    }

    private static IHostBuilder CreateWebHostBuilder(string[] args, string urls) =>
        Host.CreateDefaultBuilder(args)
            .ConfigureWebHostDefaults(webBuilder =>
            {
                webBuilder.UseStartup<Startup>();
                // Listen on all network interfaces to allow LAN access
                // Configured via appsettings.json -> Server:Urls
                // Default: http://0.0.0.0:5000 (binds to all interfaces)
                webBuilder.UseUrls(urls);
            });
}
using System.Net.WebSockets;
using horizon.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using NuGet.Protocol;

namespace horizon;

public class Startup
{
    private IConfiguration Configuration { get; }
    private static readonly List<WebSocket> ConnectedClients = new();

    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        services.AddDbContext<MyDbContext>(options =>
            options.UseNpgsql(Configuration.GetConnectionString(
                "MyPostgresDbConnection")));

        services.AddControllersWithViews(); // MVCs
    }

    private static async Task Echo(WebSocket webSocket)
    {
        // This literally just echoes ws messages back to the client, will throw an error on the front end as the result.MessageType is wrong!!
        var buffer = new byte[1024 * 4];
        var result =
            await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        while (result.CloseStatus.HasValue == false)
        {
            await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType,
                result.EndOfMessage, CancellationToken.None);
            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }

        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription,
            CancellationToken.None);

        ConnectedClients.Remove(webSocket);
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseWebSockets();

        app.Use(async (context, next) =>
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                ConnectedClients.Add(webSocket);
                // Handling ws reqs goes in this block
                // I think for file management, I should create a separate class for handling ws and pass the message in from here 
                await Echo(webSocket);
            }
            else
            {
                await next(); // A request lands, we check if it's a WebSocket request - if so we HANDLE IT, if not we pass it down to the next middleware
            }
        });

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(
                Path.Combine(Directory.GetCurrentDirectory(), "build")),
            RequestPath = ""
        });

        app.UseRouting();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers(); // MVC
            endpoints.MapFallbackToFile("index.html");
        });
    }

    public static async Task BroadcastNewDataViaWebSocketAsync(object update, bool messageType) // Send server data via ws
    {
        // TODO: This is really sloppy, no real type enforcement on update - should probably be an interface :)
        var structuredMessage = new
        {
            type = messageType ? "UPDATE" : "SERVERS",
            payload = update
        };

        var jsonString = structuredMessage.ToJson();
        Console.WriteLine(jsonString);
        
        var buffer = System.Text.Encoding.UTF8.GetBytes(jsonString);

        foreach (var webSocket in ConnectedClients.ToList().Where(webSocket => webSocket.State == WebSocketState.Open))
        {
            await webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true,
                CancellationToken.None);
        }
    }
}
using System.Net.WebSockets;
using horizon.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;

namespace horizon;

public class Startup
{
    private IConfiguration Configuration { get; }

    public Startup(IConfiguration configuration)
    {
        Configuration = configuration;
    }

    public void ConfigureServices(IServiceCollection services)
    {
        // Dependency Injection (DI) container services established here
        // Database context probably needs setting up here
        services.AddDbContext<MyDbContext>(options =>
            options.UseNpgsql(Configuration.GetConnectionString(
                "MyPostgresDbConnection")));

        services.AddControllersWithViews(); // MVCs
        //services.AddRazorPages(); // ReactJS 4 lyf
    }

    private static async Task Echo(WebSocket webSocket)
    {
        // This literally just echoes ws messages back to the client, will throw an error on the front end as the result.MessageType is wrong!!
        var buffer = new byte[1024 * 4];
        var result =
            await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        while (!result.CloseStatus.HasValue)
        {
            await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType,
                result.EndOfMessage, CancellationToken.None);
            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }

        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription,
            CancellationToken.None);
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseWebSockets();

        app.Use(async (context, next) =>
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                var webSocket = await context.WebSockets.AcceptWebSocketAsync();
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

        //app.Run(async (context) => { await context.Response.WriteAsync("HTTP Server is running!"); }); // This would override serving static files via http
        app.UseRouting();

        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers(); // MVC
            endpoints.MapFallbackToFile("index.html");
        });
    }
}
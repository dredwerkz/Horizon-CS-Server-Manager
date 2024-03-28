using System.Net.WebSockets;
using horizon.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json;
using Npgsql;
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
        services.AddDbContext<HorizonDbContext>(options =>
            options.UseNpgsql(Configuration.GetConnectionString(
                "DefaultConnection")));

        services.AddControllersWithViews(); // MVCs
    }

    private static async Task Echo(WebSocket webSocket, List<WebSocket> allClients)
    {
        var buffer = new byte[1024 * 4];
        WebSocketReceiveResult result =
            await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        while (result.CloseStatus.HasValue == false)
        {
            // Convert the byte array to a string message
            var messageString = System.Text.Encoding.UTF8.GetString(buffer, 0, result.Count);
            var messageObject = Newtonsoft.Json.Linq.JObject.Parse(messageString);

            // Check if the message type is NEW_USER
            if (messageObject.ContainsKey("type") && messageObject["type"].ToString() == "NEW_USER")
            {
                // Create a predefined JSON result. Replace this with your actual JSON content.
                var jsonServerData = await GetAllServerData();
                var jsonResult = "{\"type\": \"SERVERS\", \"payload\":" + jsonServerData + "}";

                // Convert the JSON string to a byte array
                byte[] jsonResponseBytes = System.Text.Encoding.UTF8.GetBytes(jsonResult);

                // Send the JSON response
                await webSocket.SendAsync(new ArraySegment<byte>(jsonResponseBytes), WebSocketMessageType.Text, true,
                    CancellationToken.None);
            }
            else if (messageObject.ContainsKey("type") && messageObject["type"].ToString() == "ADMIN_SWITCH")
            {
                // Create a predefined JSON result. Replace this with your actual JSON content.
                // Need to send messageObject["flag"] to db
                //Console.WriteLine("User swapped an admin flag!");

                await using var connection =
                    new NpgsqlConnection("Host=localhost;Database=postgres;Username=postgres;Password=asd123;");
                connection.Open();

                await using var cmd =
                    new NpgsqlCommand(
                        $"INSERT INTO \"Servers\" (\"ServerKey\", \"Admin\") VALUES ('{messageObject["payload"]["ServerKey"]}', {messageObject["payload"]["flag"]}) ON CONFLICT (\"ServerKey\") DO UPDATE SET \"Admin\" = EXCLUDED.\"Admin\";",
                        connection);
                cmd.ExecuteNonQuery();

                var flagString = (string)messageObject["payload"]["flag"];
                var flagToLower = flagString.ToLower();
                var adminUpdate = "{\"type\": \"ADMIN_UPDATE\", \"payload\":" + $"{{\"ServerKey\": \"{messageObject["payload"]["ServerKey"]}\", \"Admin\": {flagToLower}}}" + "}";
                //Console.WriteLine(adminUpdate);

                // Convert the JSON string to a byte array
                byte[] adminUpdateBytes = System.Text.Encoding.UTF8.GetBytes(adminUpdate);

                foreach (var conClient in allClients)
                {
                    // Send the JSON response
                    await conClient.SendAsync(new ArraySegment<byte>(adminUpdateBytes), WebSocketMessageType.Text, true,
                        CancellationToken.None);
                }
                
                


            }
            else
            {
                // If it's not a NEW_USER message, echo back the received message
                await webSocket.SendAsync(new ArraySegment<byte>(buffer, 0, result.Count), result.MessageType,
                    result.EndOfMessage, CancellationToken.None);
            }


            result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
        }


        await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);


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
                await Echo(webSocket, ConnectedClients);
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

    public static async Task
        BroadcastNewDataViaWebSocketAsync(object update, bool messageType) // Send server data via ws
    {
        // TODO: This is really sloppy, no real type enforcement on update - should probably be an interface :)
        var structuredMessage = new
        {
            type = messageType ? "UPDATE" : "SERVERS",
            payload = update
        };

        var jsonString = structuredMessage.ToJson();

        var buffer = System.Text.Encoding.UTF8.GetBytes(jsonString);

        foreach (var webSocket in ConnectedClients.ToList().Where(webSocket => webSocket.State == WebSocketState.Open))
        {
            await webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true,
                CancellationToken.None);
        }
    }

    private static async Task<string> GetAllServerData()
    {
        Console.WriteLine("GetAllServerData() called");
        var resultList = new List<Dictionary<string, object>>();

        await using var connection =
            new NpgsqlConnection("Host=localhost;Database=postgres;Username=postgres;Password=asd123;");
        await connection.OpenAsync();

        await using var cmd = new NpgsqlCommand("SELECT * FROM \"Servers\"", connection);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var row = new Dictionary<string, object>();
            for (var i = 0; i < reader.FieldCount; i++)
            {
                row[reader.GetName(i)] = reader.GetValue(i);
            }

            resultList.Add(row);
        }

        // Convert the list to JSON
        var jsonResult = JsonConvert.SerializeObject(resultList, Formatting.Indented);
        return jsonResult;
    }
}
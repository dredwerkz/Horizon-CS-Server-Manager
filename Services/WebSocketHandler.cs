using System.Net.WebSockets;
using horizon.Interfaces;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace horizon.Services;

public static class WebSocketHandler
{
    private static readonly List<WebSocket> ConnectedClients = new();
    private static readonly object ClientsLock = new();

    public static async Task HandleConnectionAsync(WebSocket webSocket, ServerRepository repository, ILogger logger)
    {
        lock (ClientsLock)
        {
            ConnectedClients.Add(webSocket);
        }

        try
        {
            var buffer = new byte[1024 * 4];
            var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!result.CloseStatus.HasValue)
            {
                try
                {
                    var messageString = System.Text.Encoding.UTF8.GetString(buffer, 0, result.Count);

                    JObject messageObject;
                    try
                    {
                        messageObject = JObject.Parse(messageString);
                    }
                    catch (JsonReaderException ex)
                    {
                        logger.LogWarning(ex, "Malformed JSON received from WebSocket client");
                        result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
                        continue;
                    }

                    var messageType = messageObject["type"]?.ToString();

                    if (messageType == "NEW_USER")
                    {
                        await HandleNewUserAsync(webSocket, repository, logger);
                    }
                    else if (messageType == "ADMIN_SWITCH")
                    {
                        await HandleAdminSwitchAsync(messageObject, repository, logger);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error processing WebSocket message");
                }

                result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            await webSocket.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
        }
        catch (WebSocketException ex)
        {
            logger.LogWarning(ex, "WebSocket connection closed unexpectedly");
        }
        finally
        {
            lock (ClientsLock)
            {
                ConnectedClients.Remove(webSocket);
            }
        }
    }

    private static async Task HandleNewUserAsync(WebSocket webSocket, ServerRepository repository, ILogger logger)
    {
        logger.LogInformation("New WebSocket user connected");

        var servers = await repository.GetAllServersAsync();
        var message = new WebSocketMessage
        {
            Type = "SERVERS",
            Payload = servers
        };

        var jsonString = JsonConvert.SerializeObject(message);
        var responseBytes = System.Text.Encoding.UTF8.GetBytes(jsonString);

        await webSocket.SendAsync(
            new ArraySegment<byte>(responseBytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None);
    }

    private static async Task HandleAdminSwitchAsync(JObject messageObject, ServerRepository repository, ILogger logger)
    {
        var payload = messageObject["payload"];
        if (payload == null)
        {
            logger.LogWarning("ADMIN_SWITCH received with no payload");
            return;
        }

        var serverKey = payload["ServerKey"]?.ToString();
        if (string.IsNullOrEmpty(serverKey))
        {
            logger.LogWarning("ADMIN_SWITCH received with no ServerKey");
            return;
        }

        var flagString = payload["flag"]?.ToString();
        if (!bool.TryParse(flagString, out var flag))
        {
            logger.LogWarning("ADMIN_SWITCH received with invalid flag value: {Flag}", flagString);
            return;
        }

        await repository.UpdateAdminFlagAsync(serverKey, flag);

        var adminUpdate = new WebSocketMessage
        {
            Type = "ADMIN_UPDATE",
            Payload = new { ServerKey = serverKey, Admin = flag }
        };

        var jsonString = JsonConvert.SerializeObject(adminUpdate);
        var updateBytes = System.Text.Encoding.UTF8.GetBytes(jsonString);

        List<WebSocket> clients;
        lock (ClientsLock)
        {
            clients = ConnectedClients.Where(ws => ws.State == WebSocketState.Open).ToList();
        }

        foreach (var client in clients)
        {
            try
            {
                await client.SendAsync(
                    new ArraySegment<byte>(updateBytes),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
            }
            catch (WebSocketException ex)
            {
                logger.LogWarning(ex, "Failed to send admin update to a client");
            }
        }
    }

    public static async Task BroadcastUpdateAsync(object update, ILogger logger)
    {
        var message = new WebSocketMessage
        {
            Type = "UPDATE",
            Payload = update
        };

        var jsonString = JsonConvert.SerializeObject(message);
        var buffer = System.Text.Encoding.UTF8.GetBytes(jsonString);

        List<WebSocket> clients;
        lock (ClientsLock)
        {
            clients = ConnectedClients.Where(ws => ws.State == WebSocketState.Open).ToList();
        }

        foreach (var client in clients)
        {
            try
            {
                await client.SendAsync(
                    new ArraySegment<byte>(buffer),
                    WebSocketMessageType.Text,
                    true,
                    CancellationToken.None);
            }
            catch (WebSocketException ex)
            {
                logger.LogWarning(ex, "Failed to broadcast update to a client");
            }
        }
    }
}

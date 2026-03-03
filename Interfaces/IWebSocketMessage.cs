namespace horizon.Interfaces;

public interface IWebSocketMessage
{
    string Type { get; }
    object Payload { get; }
}

public class WebSocketMessage : IWebSocketMessage
{
    public string Type { get; set; }
    public object Payload { get; set; }
}

using FluentAssertions;
using horizon.Interfaces;
using Newtonsoft.Json;
using Xunit;

namespace horizon.Tests.Interfaces;

/// <summary>
/// Tests for WebSocket message handling and serialization
/// </summary>
public class WebSocketMessageTests
{
    [Fact]
    public void WebSocketMessage_ShouldImplement_IWebSocketMessage()
    {
        // Arrange & Act
        var message = new WebSocketMessage();

        // Assert
        message.Should().BeAssignableTo<IWebSocketMessage>();
    }

    [Fact]
    public void WebSocketMessage_ShouldSerialize_WithTypeAndPayload()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "UPDATE",
            Payload = new { ServerId = "123", Score = 10 }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);
        var deserialized = JsonConvert.DeserializeObject<WebSocketMessage>(json);

        // Assert
        deserialized.Should().NotBeNull();
        deserialized.Type.Should().Be("UPDATE");
        deserialized.Payload.Should().NotBeNull();
    }

    [Fact]
    public void WebSocketMessage_ShouldSerialize_UpdateMessage()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "UPDATE",
            Payload = new
            {
                ServerKey = "192.168.1.100:12345",
                Map = "de_dust2",
                ScoreCt = 10,
                ScoreT = 7,
                Rounds = 5,
                Admin = false
            }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);

        // Assert
        json.Should().Contain("\"Type\":\"UPDATE\"");
        json.Should().Contain("\"ServerKey\"");
        json.Should().Contain("de_dust2");
    }

    [Fact]
    public void WebSocketMessage_ShouldSerialize_NewUserMessage()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "NEW_USER",
            Payload = new { Message = "Welcome" }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);

        // Assert
        json.Should().Contain("\"Type\":\"NEW_USER\"");
        json.Should().Contain("Welcome");
    }

    [Fact]
    public void WebSocketMessage_ShouldSerialize_AdminSwitchMessage()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "ADMIN_SWITCH",
            Payload = new
            {
                ServerKey = "192.168.1.100:12345",
                Admin = true
            }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);

        // Assert
        json.Should().Contain("\"Type\":\"ADMIN_SWITCH\"");
        json.Should().Contain("\"Admin\":true");
    }

    [Fact]
    public void WebSocketMessage_ShouldDeserialize_FromJson()
    {
        // Arrange
        var json = @"{""Type"":""UPDATE"",""Payload"":{""ServerKey"":""test"",""Score"":10}}";

        // Act
        var message = JsonConvert.DeserializeObject<WebSocketMessage>(json);

        // Assert
        message.Should().NotBeNull();
        message.Type.Should().Be("UPDATE");
        message.Payload.Should().NotBeNull();
    }

    [Theory]
    [InlineData("UPDATE")]
    [InlineData("NEW_USER")]
    [InlineData("ADMIN_SWITCH")]
    [InlineData("ERROR")]
    public void WebSocketMessage_ShouldSupport_VariousMessageTypes(string messageType)
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = messageType,
            Payload = new { Data = "test" }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);
        var deserialized = JsonConvert.DeserializeObject<WebSocketMessage>(json);

        // Assert
        deserialized.Type.Should().Be(messageType);
    }

    [Fact]
    public void WebSocketMessage_ShouldHandle_NullPayload()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "PING",
            Payload = null
        };

        // Act
        var json = JsonConvert.SerializeObject(message);
        var deserialized = JsonConvert.DeserializeObject<WebSocketMessage>(json);

        // Assert
        deserialized.Type.Should().Be("PING");
        deserialized.Payload.Should().BeNull();
    }

    [Fact]
    public void WebSocketMessage_ShouldHandle_ComplexPayload()
    {
        // Arrange
        var message = new WebSocketMessage
        {
            Type = "UPDATE",
            Payload = new
            {
                Servers = new[]
                {
                    new { Id = 1, Name = "Server1" },
                    new { Id = 2, Name = "Server2" }
                },
                Timestamp = DateTime.UtcNow,
                PlayerCount = 10
            }
        };

        // Act
        var json = JsonConvert.SerializeObject(message);
        var deserialized = JsonConvert.DeserializeObject<WebSocketMessage>(json);

        // Assert
        deserialized.Should().NotBeNull();
        deserialized.Type.Should().Be("UPDATE");
        deserialized.Payload.Should().NotBeNull();
    }

    [Fact]
    public void WebSocketMessage_Properties_ShouldBeSettable()
    {
        // Arrange
        var message = new WebSocketMessage();

        // Act
        message.Type = "TEST";
        message.Payload = new { Value = 42 };

        // Assert
        message.Type.Should().Be("TEST");
        message.Payload.Should().NotBeNull();
    }
}

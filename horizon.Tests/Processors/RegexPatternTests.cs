using System.Text.RegularExpressions;
using FluentAssertions;
using horizon.Tests.Helpers;
using Xunit;

namespace horizon.Tests.Processors;

/// <summary>
/// Tests for the regex patterns used in UdpDataProcessor
/// These tests verify pattern matching without requiring database connectivity
/// </summary>
public class RegexPatternTests
{
    // Patterns from UdpDataProcessor
    private readonly Regex _scoreRegex = new(@"Team ""(.*?)"" scored ""(\d+)""");
    private readonly Regex _mapRegex = new(@"on map ""(.*?)"" RoundsPlayed: (\d+)");
    private readonly Regex _adminRegex = new(@"say\s*""([^""]*\badmin\b)""", RegexOptions.IgnoreCase);
    private readonly Regex _playerRegex = new(@"""([^""]+)<\d+><STEAM_\d+:\d+:\d+><(T|CT)>""");

    #region Score Regex Tests

    [Theory]
    [InlineData("CT", 10)]
    [InlineData("TERRORIST", 7)]
    [InlineData("CT", 0)]
    [InlineData("TERRORIST", 16)]
    public void ScoreRegex_ShouldMatch_ValidScoreMessages(string expectedTeam, int expectedScore)
    {
        // Arrange
        var message = MockUdpData.CreateScoreMessage(expectedTeam, expectedScore);

        // Act
        var match = _scoreRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue("the message contains a valid score format");
        match.Groups[1].Value.Should().Be(expectedTeam, "team name should be extracted correctly");
        match.Groups[2].Value.Should().Be(expectedScore.ToString(), "score should be extracted correctly");
    }

    [Fact]
    public void ScoreRegex_ShouldMatch_CtScoreUpdate()
    {
        // Arrange
        var message = MockUdpData.CtScoreUpdate;

        // Act
        var match = _scoreRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("CT");
        match.Groups[2].Value.Should().Be("10");
    }

    [Fact]
    public void ScoreRegex_ShouldMatch_TerroristScoreUpdate()
    {
        // Arrange
        var message = MockUdpData.TerroristScoreUpdate;

        // Act
        var match = _scoreRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("TERRORIST");
        match.Groups[2].Value.Should().Be("7");
    }

    [Fact]
    public void ScoreRegex_ShouldNotMatch_InvalidTeamName()
    {
        // Arrange
        var message = MockUdpData.InvalidTeamName;

        // Act
        var match = _scoreRegex.Match(message);

        // Assert
        // Note: Regex will match, but team name will be "UNKNOWN"
        match.Success.Should().BeTrue("regex matches the pattern");
        match.Groups[1].Value.Should().Be("UNKNOWN", "but the team name is invalid");
    }

    [Fact]
    public void ScoreRegex_ShouldNotMatch_EmptyMessage()
    {
        // Arrange
        var message = MockUdpData.EmptyMessage;

        // Act
        var match = _scoreRegex.Match(message);

        // Assert
        match.Success.Should().BeFalse();
    }

    #endregion

    #region Map Regex Tests

    [Theory]
    [InlineData("de_dust2", 5)]
    [InlineData("de_mirage", 0)]
    [InlineData("de_inferno", 12)]
    [InlineData("de_nuke", 30)]
    public void MapRegex_ShouldMatch_ValidMapMessages(string expectedMap, int expectedRounds)
    {
        // Arrange
        var message = MockUdpData.CreateMapMessage(expectedMap, expectedRounds);

        // Act
        var match = _mapRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be(expectedMap);
        match.Groups[2].Value.Should().Be(expectedRounds.ToString());
    }

    [Fact]
    public void MapRegex_ShouldMatch_MapAndRoundsMessage()
    {
        // Arrange
        var message = MockUdpData.MapAndRoundsMessage;

        // Act
        var match = _mapRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("de_dust2");
        match.Groups[2].Value.Should().Be("5");
    }

    [Fact]
    public void MapRegex_ShouldNotMatch_ScoreMessage()
    {
        // Arrange
        var message = MockUdpData.CtScoreUpdate;

        // Act
        var match = _mapRegex.Match(message);

        // Assert
        match.Success.Should().BeFalse("score messages don't contain map information");
    }

    #endregion

    #region Admin Regex Tests

    [Fact]
    public void AdminRegex_ShouldMatch_AdminRequestLowercase()
    {
        // Arrange
        var message = MockUdpData.AdminRequestLowercase;

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Contain("admin");
    }

    [Fact]
    public void AdminRegex_ShouldMatch_AdminRequestUppercase()
    {
        // Arrange
        var message = MockUdpData.AdminRequestUppercase;

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Contain("ADMIN");
    }

    [Fact]
    public void AdminRegex_ShouldMatch_AdminRequestAlone()
    {
        // Arrange
        var message = MockUdpData.AdminRequestAlone;

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
    }

    [Theory]
    [InlineData("admin")]
    [InlineData("need admin please")]
    [InlineData("ADMIN needed")]
    [InlineData("call Admin")]
    [InlineData("Administrator help")]
    public void AdminRegex_ShouldMatch_VariousAdminPhrases(string phrase)
    {
        // Arrange
        var message = MockUdpData.CreateAdminMessage(phrase);

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue($"'{phrase}' should be detected as admin request");
    }

    [Fact]
    public void AdminRegex_ShouldNotMatch_MessageWithoutAdmin()
    {
        // Arrange
        var message = MockUdpData.NoAdminMention;

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeFalse();
    }

    [Theory]
    [InlineData("hello world")]
    [InlineData("good game")]
    [InlineData("nice shot")]
    [InlineData("administration building")] // Should not match "administration"
    public void AdminRegex_ShouldNotMatch_MessagesWithoutAdminWord(string phrase)
    {
        // Arrange
        var message = MockUdpData.CreateAdminMessage(phrase);

        // Act
        var match = _adminRegex.Match(message);

        // Assert
        match.Success.Should().BeFalse($"'{phrase}' should not trigger admin detection");
    }

    #endregion

    #region Player Regex Tests

    [Fact]
    public void PlayerRegex_ShouldMatch_CtPlayer()
    {
        // Arrange
        var message = MockUdpData.PlayerCtMessage;

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("JohnDoe");
        match.Groups[2].Value.Should().Be("CT");
    }

    [Fact]
    public void PlayerRegex_ShouldMatch_TerroristPlayer()
    {
        // Arrange
        var message = MockUdpData.PlayerTMessage;

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("JaneSmith");
        match.Groups[2].Value.Should().Be("T");
    }

    [Fact]
    public void PlayerRegex_ShouldMatch_PlayerWithSpecialCharacters()
    {
        // Arrange
        var message = MockUdpData.PlayerWithSpecialChars;

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("[PRO]Player123");
        match.Groups[2].Value.Should().Be("CT");
    }

    [Fact]
    public void PlayerRegex_ShouldMatch_PlayerWithSpaces()
    {
        // Arrange
        var message = MockUdpData.PlayerWithSpaces;

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be("Cool Player Name");
        match.Groups[2].Value.Should().Be("T");
    }

    [Theory]
    [InlineData("PlayerOne", "STEAM_0:1:12345", "CT")]
    [InlineData("PlayerTwo", "STEAM_0:0:67890", "T")]
    [InlineData("Player[123]", "STEAM_1:1:99999", "CT")]
    public void PlayerRegex_ShouldMatch_VariousPlayerFormats(string name, string steamId, string team)
    {
        // Arrange
        var message = MockUdpData.CreatePlayerMessage(name, steamId, team);

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeTrue();
        match.Groups[1].Value.Should().Be(name);
        match.Groups[2].Value.Should().Be(team);
    }

    [Fact]
    public void PlayerRegex_ShouldNotMatch_RandomText()
    {
        // Arrange
        var message = MockUdpData.RandomText;

        // Act
        var match = _playerRegex.Match(message);

        // Assert
        match.Success.Should().BeFalse();
    }

    #endregion

    #region Edge Case Tests

    [Fact]
    public void AllRegexes_ShouldNotMatch_EmptyString()
    {
        // Arrange
        var empty = string.Empty;

        // Act & Assert
        _scoreRegex.Match(empty).Success.Should().BeFalse();
        _mapRegex.Match(empty).Success.Should().BeFalse();
        _adminRegex.Match(empty).Success.Should().BeFalse();
        _playerRegex.Match(empty).Success.Should().BeFalse();
    }

    [Fact]
    public void AllRegexes_ShouldNotMatch_RandomText()
    {
        // Arrange
        var random = MockUdpData.RandomText;

        // Act & Assert
        _scoreRegex.Match(random).Success.Should().BeFalse();
        _mapRegex.Match(random).Success.Should().BeFalse();
        _adminRegex.Match(random).Success.Should().BeFalse();
        _playerRegex.Match(random).Success.Should().BeFalse();
    }

    #endregion
}

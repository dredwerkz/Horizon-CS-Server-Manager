# nullable enable
using System.Net;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Logging;

namespace horizon.Processors;

public class UdpDataProcessor
{
    public string ServerKey { get; private set; }
    public string? Map { get; private set; }
    public int? ScoreCt { get; private set; }
    public int? ScoreT { get; private set; }
    public int? Rounds { get; private set; }
    public bool? Admin { get; private set; }
    public List<string> PlayersCt { get; set; }
    public List<string> PlayersT { get; set; }

    public bool HasParsedData =>
        ScoreCt != null || ScoreT != null || Map != null ||
        Rounds != null || Admin != null ||
        PlayersCt.Count > 0 || PlayersT.Count > 0;

    private static readonly Regex ScoreRegex = new(@"Team ""(.*?)"" scored ""(\d+)""", RegexOptions.Compiled);
    private static readonly Regex MapRegex = new(@"on map ""(.*?)"" RoundsPlayed: (\d+)", RegexOptions.Compiled);
    private static readonly Regex AdminRegex = new(@"say\s*""([^""]*\badmin\b)""", RegexOptions.Compiled | RegexOptions.IgnoreCase);
    private static readonly Regex PlayerRegex = new(@"""([^""]+)<\d+><STEAM_\d+:\d+:\d+><(T|CT)>""", RegexOptions.Compiled);

    private readonly ILogger? _logger;

    public UdpDataProcessor(IPEndPoint serverKey, string receivedData, ILogger? logger = null)
    {
        _logger = logger;
        ServerKey = serverKey.ToString();
        PlayersCt = new List<string>();
        PlayersT = new List<string>();
        ProcessRawData(receivedData);
    }

    private void ProcessRawData(string receivedData)
    {
        var scoreMatch = ScoreRegex.Match(receivedData);
        var mapMatch = MapRegex.Match(receivedData);
        var adminMatch = AdminRegex.Match(receivedData);
        var playerMatch = PlayerRegex.Match(receivedData);

        if (scoreMatch.Success)
        {
            var teamName = scoreMatch.Groups[1].Value;

            if (!int.TryParse(scoreMatch.Groups[2].Value, out var teamScore))
            {
                _logger?.LogWarning("Failed to parse score value: {Value}", scoreMatch.Groups[2].Value);
                return;
            }

            switch (teamName)
            {
                case "CT":
                    ScoreCt = teamScore;
                    break;
                case "TERRORIST":
                    ScoreT = teamScore;
                    break;
                default:
                    _logger?.LogWarning("Unknown team name: {TeamName}", teamName);
                    break;
            }
        }
        else if (mapMatch.Success)
        {
            Map = mapMatch.Groups[1].Value;

            if (!int.TryParse(mapMatch.Groups[2].Value, out var roundsPlayed))
            {
                _logger?.LogWarning("Failed to parse rounds value: {Value}", mapMatch.Groups[2].Value);
                return;
            }

            Rounds = roundsPlayed;
        }
        else if (adminMatch.Success)
        {
            Admin = true;
        }
        else if (playerMatch.Success)
        {
            var playerName = playerMatch.Groups[1].Value;
            var playerTeam = playerMatch.Groups[2].Value;

            if (playerTeam == "CT")
            {
                PlayersCt.Add(playerName);
            }
            else
            {
                PlayersT.Add(playerName);
            }
        }
    }
}

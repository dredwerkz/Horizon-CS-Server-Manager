# nullable enable
using System.Net;
using System.Text.RegularExpressions;
using horizon.Data;
using horizon.Data.Models;
using Newtonsoft.Json;
using Npgsql;


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

    private readonly Regex _scoreRegex = new(@"Team ""(.*?)"" scored ""(\d+)""");
    private readonly Regex _mapRegex = new(@"on map ""(.*?)"" RoundsPlayed: (\d+)");
    private readonly Regex _adminRegex = new(@"say\s*""([^""]*\badmin\b)""");
    private readonly Regex _playerRegex = new(@"""([^""]+)<\d+><STEAM_\d+:\d+:\d+><(T|CT)>""");

    private readonly HorizonDbContext _context;

    public UdpDataProcessor( /*HorizonDbContext context, */ IPEndPoint serverKey, string receivedData)
    {
        ServerKey = serverKey.ToString();
        PlayersCt = new List<string>();
        PlayersT = new List<string>();
        ProcessRawData(receivedData);
        var serversTable = UpdateDatabase();
        Console.WriteLine(serversTable);
    }

    private void ProcessRawData(string receivedData)
    {
        var scoreMatch = _scoreRegex.Match(receivedData);
        var mapMatch = _mapRegex.Match(receivedData);
        var adminMatch = _adminRegex.Match(receivedData);
        var playerMatch = _playerRegex.Match(receivedData);

        if (scoreMatch.Success)
        {
            var teamName = scoreMatch.Groups[1].Value;
            var teamScore = int.Parse(scoreMatch.Groups[2].Value);

            switch (teamName)
            {
                case "CT":
                    ScoreCt = teamScore;
                    break;
                case "TERRORIST":
                    ScoreT = teamScore;
                    break;
                default:
                    Console.WriteLine("Team Name isn't CT or TERRORIST, ignoring match.");
                    break;
            }
        }
        else if (mapMatch.Success)
        {
            var mapName = mapMatch.Groups[1].Value;
            var roundsPlayed = mapMatch.Groups[2].Value;

            Map = mapName;
            Rounds = int.Parse(roundsPlayed);
        }
        else if (adminMatch.Success)
        {
            Admin = true;
        }
        else if (playerMatch.Success)
        {
            var playerName = playerMatch.Groups[1].ToString();
            var playerTeam = playerMatch.Groups[2].ToString();

            //Console.WriteLine(playerName);
            //Console.WriteLine(playerTeam);

            if (playerTeam == "CT")
            {
                PlayersCt.Add(playerName);
            }
            else
            {
                PlayersT.Add(playerName);
            }
        }
        // TODO: Create arrays for team members for CT and T for React to iterate through,
        // TODO: .Add() player names to that array and gogo
    }

    private string UpdateDatabase()
    {
        // Default values for a new row
        const int defaultScoreCt = 0;
        const int defaultScoreT = 0;
        const string defaultMap = "de_unknown";
        const int defaultRounds = 0;
        const bool defaultAdmin = false;

        // SQL command for upserting data
        var upsertCommand =
            @"INSERT INTO \"Servers\" (\"ServerKey\", \"ScoreCt\", \"ScoreT\", \"Map\", \"Rounds\", \"Admin\")
        VALUES(@ServerKey, @ScoreCt, @ScoreT, @Map, @Rounds, @Admin)
        ON CONFLICT(\
        "ServerKey\") 
        DO UPDATE SET \"ScoreCt\" = EXCLUDED.\"ScoreCt\", \"ScoreT\" = EXCLUDED.\"ScoreT\", 
            \"Map\" = EXCLUDED.\"Map\", \"Rounds\" = EXCLUDED.\"Rounds\", \"Admin\" = EXCLUDED.\"Admin\";";

        using var connection =
            new NpgsqlConnection("Host=localhost;Database=postgres;Username=postgres;Password=asd123;");
        connection.Open();

        using var cmd = new NpgsqlCommand(upsertCommand, connection);

        cmd.ExecuteNonQuery(); // Execute the command

        return "Data upserted successfully";
    }


    // TODO: I need to determine the type of message being received, and send it to a controller to extract the data I want from it
    // So original js path was udpServer -> processServerOutput -> messageHandlers which then gets pulled all the way back.
    // I want to run messageHandlers in this processor directly, and update the props accordingly.
    // In the old JS system how much data did I pass through?
    // We pass through incomplete data to the front end, which just updates each serverKey entry with the data that *is* there.
    // TODO: Check if I can just null out stuff I don't want to update
}
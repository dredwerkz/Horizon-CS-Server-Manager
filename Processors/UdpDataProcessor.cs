# nullable enable
using System.Net;
using horizon.Interfaces;
using System.Text.RegularExpressions;
using horizon.Classes;
using Microsoft.EntityFrameworkCore.Metadata.Internal;

namespace horizon.Processors;

public class UdpDataProcessor
{
    public string ServerKey { get; private set; }
    public string ReceivedData { get; private set; }
    public string? Map { get; private set; }
    public int? ScoreCt { get; private set; }
    public int? ScoreT { get; private set; }
    public int? Rounds { get; private set; }
    public bool? Admin { get; private set; }

    public UdpDataProcessor(IPEndPoint serverKey, string receivedData)
    {
        ServerKey = serverKey.ToString();
        ReceivedData = receivedData;

        var scoreRegex = new Regex(@"Team ""(.*?)"" scored ""(\d+)""");
        var mapRegex = new Regex(@"on map ""(.*?)"" RoundsPlayed: (\d+)");

        var scoreMatch = scoreRegex.Match(receivedData);
        var mapMatch = mapRegex.Match(receivedData);

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
    }


    // TODO: I need to determine the type of message being received, and send it to a controller to extract the data I want from it
    // So original js path was udpServer -> processServerOutput -> messageHandlers which then gets pulled all the way back.
    // I want to run messageHandlers in this processor directly, and update the props accordingly.
    // In the old JS system how much data did I pass through?
    // We pass through incomplete data to the front end, which just updates each serverKey entry with the data that *is* there.
    // TODO: Check if I can just null out stuff I don't want to update
}
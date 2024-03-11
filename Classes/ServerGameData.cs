#nullable enable
using horizon.Interfaces;

namespace horizon.Classes;

public class ServerGameData : IServerGameData
{
    public string? Map { get; set; }
    public string? ScoreCt { get; set; }
    public string? ScoreT { get; set; }
    public int? Rounds { get; set; }
    public bool? Admin { get; set; }
}
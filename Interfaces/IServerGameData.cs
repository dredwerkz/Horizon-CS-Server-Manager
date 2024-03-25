#nullable enable
namespace horizon.Interfaces;

interface IServerGameData
{
    public string? Map { get; set; }
    public string? ScoreCt { get; set; }
    public string? ScoreT { get; set; }
    public int? Rounds { get; set; }
    public bool? Admin { get; set; }
}
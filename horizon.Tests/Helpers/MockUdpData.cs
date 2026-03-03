namespace horizon.Tests.Helpers;

/// <summary>
/// Mock UDP data samples based on actual Counter-Strike server log formats
/// </summary>
public static class MockUdpData
{
    // Score update messages
    public const string CtScoreUpdate = @"L 03/03/2026 - 12:00:00: Team ""CT"" scored ""10"" with ""5"" players";
    public const string TerroristScoreUpdate = @"L 03/03/2026 - 12:00:00: Team ""TERRORIST"" scored ""7"" with ""5"" players";
    public const string CtScoreZero = @"L 03/03/2026 - 12:00:00: Team ""CT"" scored ""0"" with ""5"" players";
    public const string TerroristScoreMax = @"L 03/03/2026 - 12:00:00: Team ""TERRORIST"" scored ""16"" with ""5"" players";

    // Map and rounds messages
    public const string MapAndRoundsMessage = @"L 03/03/2026 - 12:00:00: World triggered ""Match_Start"" on map ""de_dust2"" RoundsPlayed: 5";
    public const string MapMirage = @"L 03/03/2026 - 12:00:00: World triggered ""Match_Start"" on map ""de_mirage"" RoundsPlayed: 0";
    public const string MapInferno = @"L 03/03/2026 - 12:00:00: World triggered ""Match_Start"" on map ""de_inferno"" RoundsPlayed: 12";

    // Admin request messages
    public const string AdminRequestLowercase = @"L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:12345><CT>"" say ""need admin please""";
    public const string AdminRequestUppercase = @"L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:12345><CT>"" say ""ADMIN needed""";
    public const string AdminRequestMixedCase = @"L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:12345><CT>"" say ""call Admin""";
    public const string AdminRequestAlone = @"L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:12345><CT>"" say ""admin""";

    // Player messages
    public const string PlayerCtMessage = @"L 03/03/2026 - 12:00:00: ""JohnDoe<15><STEAM_0:1:12345><CT>"" purchased ""weapon_awp""";
    public const string PlayerTMessage = @"L 03/03/2026 - 12:00:00: ""JaneSmith<22><STEAM_0:0:67890><T>"" purchased ""weapon_ak47""";
    public const string PlayerWithSpecialChars = @"L 03/03/2026 - 12:00:00: ""[PRO]Player123<15><STEAM_0:1:12345><CT>"" purchased ""weapon_awp""";
    public const string PlayerWithSpaces = @"L 03/03/2026 - 12:00:00: ""Cool Player Name<15><STEAM_0:1:12345><T>"" purchased ""weapon_awp""";

    // Edge cases and invalid data
    public const string EmptyMessage = "";
    public const string InvalidTeamName = @"L 03/03/2026 - 12:00:00: Team ""UNKNOWN"" scored ""10"" with ""5"" players";
    public const string MalformedScore = @"L 03/03/2026 - 12:00:00: Team ""CT"" scored ""abc"" with ""5"" players";
    public const string NoAdminMention = @"L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:12345><CT>"" say ""hello world""";
    public const string RandomText = "This is just random text that doesn't match any pattern";

    // Complex multi-line scenarios (not used by current parser but good for future)
    public const string MultiplePlayersMessage = @"
L 03/03/2026 - 12:00:00: ""Player1<15><STEAM_0:1:11111><CT>"" purchased ""weapon_awp""
L 03/03/2026 - 12:00:01: ""Player2<16><STEAM_0:1:22222><CT>"" purchased ""weapon_m4a1""
L 03/03/2026 - 12:00:02: ""Player3<17><STEAM_0:1:33333><T>"" purchased ""weapon_ak47""
";

    // Helper method to create variations
    public static string CreateScoreMessage(string team, int score)
    {
        return $@"L 03/03/2026 - 12:00:00: Team ""{team}"" scored ""{score}"" with ""5"" players";
    }

    public static string CreateMapMessage(string mapName, int rounds)
    {
        return $@"L 03/03/2026 - 12:00:00: World triggered ""Match_Start"" on map ""{mapName}"" RoundsPlayed: {rounds}";
    }

    public static string CreatePlayerMessage(string playerName, string steamId, string team, string action = "purchased")
    {
        return $@"L 03/03/2026 - 12:00:00: ""{playerName}<15><{steamId}><{team}>"" {action} ""weapon_awp""";
    }

    public static string CreateAdminMessage(string message)
    {
        return $@"L 03/03/2026 - 12:00:00: ""Player<15><STEAM_0:1:12345><CT>"" say ""{message}""";
    }
}

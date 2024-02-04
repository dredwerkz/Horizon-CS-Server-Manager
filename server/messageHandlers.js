/** Regex //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/

const messageHandlers = [
    {
        regex: /Team \"(.*?)\" scored \"(\d+)\"/,
        handler: (bundle) => testUpdaters(bundle),
    },
    /*     {
        regex: /on map \"(.*?)\" RoundsPlayed: (\d+)/,
        handler: (match) => updateMap(serverIndex, match[1], match[2]),
    },
    {
        regex: /say\s*"[^"]*\badmin\b/,
        handler: (_match) => updateAdminReq(serverIndex, _match),
    },
    {
        regex: /\badmin_issue_solved\b/,
        handler: (_match) => cancelAdminReq(serverIndex, _match),
    },*/
];

export default messageHandlers;

/** Handlers //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/

// Temp

function testUpdaters({ serverKey, match }) {
    const newData = {
        [match[1]]: [match[2]],
    };

    return { serverKey, newData };
}

// OK so doing it this way I need to bundle and deconstruct the regex match and serverKey like above

// End Temp

function updateScore(serverIndex, team, score) {
    serverContainer[serverIndex][team] = score;
    writeServerContainerToFile(serverContainer);
}

function updateMap(serverIndex, map, rounds) {
    serverContainer[serverIndex]["map"] = map;
    serverContainer[serverIndex]["rounds"] = rounds;
    writeServerContainerToFile(serverContainer);
}

function updateAdminReq(serverIndex, _match) {
    serverContainer[serverIndex]["admin"] = true;
    writeServerContainerToFile(serverContainer);
}

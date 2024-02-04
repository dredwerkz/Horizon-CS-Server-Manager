// Temp

const serverContainer = {}

export function testUpdaters({serverKey, match}) {
    console.log(`testUpdaters was called with ${match[1]} and ${match[2]} from ${serverKey}`)
}

// OK so doing it this way I need to bundle and deconstruct the regex match and serverKey like above

// End Temp



export function updateScore(serverIndex, team, score) {
    serverContainer[serverIndex][team] = score;
    writeServerContainerToFile(serverContainer);
}

export function updateMap(serverIndex, map, rounds) {
    serverContainer[serverIndex]["map"] = map;
    serverContainer[serverIndex]["rounds"] = rounds;
    writeServerContainerToFile(serverContainer);
}

export function updateAdminReq(serverIndex, _match) {
    serverContainer[serverIndex]["admin"] = true;
    writeServerContainerToFile(serverContainer);
}
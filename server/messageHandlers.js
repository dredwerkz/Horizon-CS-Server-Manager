import * as dbHandlers from "./dbHandlers/dbHandlers.js";

/** Regex //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////*/

const messageHandlers = [
    {
        regex: /Team \"(.*?)\" scored \"(\d+)\"/,
        handler: (bundle) => updateScore(bundle),
    },
    {
        regex: /on map \"(.*?)\" RoundsPlayed: (\d+)/,
        handler: (bundle) => updateMap(bundle),
    },
    /*{
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

function updateScore({ serverKey, match }) {
    // match[1] is the team side (T/CT), match[2] is the score
    const newData = {
        [match[1]]: [match[2]],
    };

    dbHandlers.updateScore(serverKey, match[1], match[2]);

    return { serverKey, newData };
}

function updateMap({ serverKey, match }) {
    /* match[1] = map match[2] = rounds */
    const newData = {
        map: match[1],
        rounds: match[2],
    };

    dbHandlers.updateMap(serverKey, newData);

    return { serverKey, newData };
}

function updateAdminReq(serverIndex, _match) {
    serverContainer[serverIndex]["admin"] = true;
    writeServerContainerToFile(serverContainer);
}

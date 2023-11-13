import dgram from "dgram";
import path from "node:path";
import fs from "node:fs/promises";

const filePath = path.resolve(process.cwd(), "./public/serverContainer.json");

const server = dgram.createSocket("udp4");

const serverContainer = await readServerContainerFile();

server.on("error", (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});

/*

WebSocket was here, then I decided to make life easy and read/write to and from a json file instead lol

*/

server.on("message", (msg, rinfo) => {
    // console.log(`Consumer heard: ${msg} from ${rinfo.address}:${rinfo.port}`);
    updateServerContainer(msg, rinfo.address, rinfo.port);
});

server.on("listening", () => {
    const address = server.address();
    console.log(`Consumer listening on: ${address.address}:${address.port}`);
});

// Port for listen server
server.bind(12345);

async function writeServerContainerToFile(container) {
    try {
        const data = JSON.stringify(container, null, 2); // Convert the object to a JSON string
        await fs.writeFile(filePath, data, "utf8"); // Write the JSON string to a file
    } catch (err) {
        console.error("Error writing serverContainer to file:", err);
    }
}

async function readServerContainerFile() {
    const JSONList = await fs.readFile(filePath);
    const parsedList = JSON.parse(JSONList);
    return parsedList;
}

function updateServerContainer(msg, addr, port) {
    const serverKey = `${addr}:${port}`;

    let serverIndex = serverContainer.findIndex(
        (server) => server.server === serverKey
    );

    if (serverIndex === -1) {
        serverIndex = serverContainer.length;
        serverContainer.push({ server: serverKey });
    }

    const messageHandlers = [
        {
            regex: /Team \"(.*?)\" scored \"(\d+)\"/,
            handler: (match) => updateScore(serverIndex, match[1], match[2]),
        },
        {
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
        },
    ];

    for (let { regex, handler } of messageHandlers) {
        const match = msg.toString().match(regex);
        if (match) {
            handler(match);
            break;
        }
    }
}

/*

Need to make a function that runs on each message, that checks if the message is from an addr_port that exists already.
If it already exists, no need to do anything, if it doesn't exist it needs to create a new sub-object to contain that server's default values.
Creating a server's default values should be in a function of its own, as it'll need to run every time a game finishes.

When serverContainer[serverKey][rounds] = 12
I need to write a function that handles the teams swapping sides


*/

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
    // console.log(`${serverIndex} called for an admin`);
    serverContainer[serverIndex]["admin"] = true;
    writeServerContainerToFile(serverContainer);
}

function cancelAdminReq(serverIndex, _match) {
    // Need to send { rcon echo admin_issue_solved } via front-end to cancel alert.
    // console.log(`${serverIndex} no longer needs an admin`);
    serverContainer[serverIndex]["admin"] = false;
    writeServerContainerToFile(serverContainer);
}

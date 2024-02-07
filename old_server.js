import dgram from "dgram";
import path from "node:path";
import fs from "node:fs/promises";
import WebSocket from 'ws'
import http from 'http'

const PORT = 8080

const CLIENT = {
    MESSAGE: {
      NEW_USER: 'NEW_USER',
      NEW_MESSAGE: 'NEW_MESSAGE'
    }
  };

const filePath = path.resolve(process.cwd(), "./public/serverContainer.json");

const httpServer = http.createServer((req, res) => {
    // get the file path from req.url, or '/public/index.html' if req.url is '/'
    const httpFilePath = ( req.url === '/' ) ? '/public/index.html' : req.url;
  
    // determine the contentType by the file extension
    const extname = path.extname(httpFilePath);
    let contentType = 'text/html';
    if (extname === '.js') contentType = 'text/javascript';
    else if (extname === '.css') contentType = 'text/css';
  
    // pipe the proper file to the res object
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(`${__dirname}/${httpFilePath}`, 'utf8').pipe(res);
  });

const server = dgram.createSocket("udp4");

const wsServer = new WebSocket.Server({ httpServer });

const serverContainer = await readServerContainerFile();

server.on("error", (err) => {
    console.log(`Server error:\n${err.stack}`);
    server.close();
});

/** /////////////////////////////////////////////////////////////////
 * HTTP */

// Start the server listening on localhost:8080
httpServer.listen(PORT, () => {
    console.log(`Listening on: http://localhost:${httpServer.address().port}`);
  });

/*

WebSocket was here, then I decided to make life easy and read/write to and from a json file instead for building out the front-end
Will re-introduce WebSocket now I have the front-end pulling properly

*/

/** /////////////////////////////////////////////////////////////////
 * WebSocket */

wsServer.on('connection', (socket) => {
    socket.on('message', (message) => {
        broadcast(message, socket)
    })
})


/** /////////////////////////////////////////////////////////////////
 * UDP Listener */

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

    /*
    L 05/31/2023 - 22:33:00: Team "CT" scored "6" with "3" players
    L 05/31/2023 - 22:33:00: Team "TERRORIST" scored "8" with "3" players
    */

    // Array of objects containing regex for specific server logs we want to act on and the appropriate function to run on match
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
    // Need to send { rcon echo admin_issue_solved } via front-end to cancel alert. -- Why?? Just do it on the front end and write to file. The server doesn't care
    // console.log(`${serverIndex} no longer needs an admin`);
    serverContainer[serverIndex]["admin"] = false;
    writeServerContainerToFile(serverContainer);
}

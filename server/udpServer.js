import dgram from "dgram";
import processServerOutput from "./processServerOutput.js";

function createUdpServer(serverContainerManager, eventEmitter) {
    const server = dgram.createSocket("udp4");

    server.on("error", (err) => {
        console.error(`UDP Server error:\n${err.stack}`);
        server.close();
    });

    server.on("message", (msg, rinfo) => {
        //console.log(`UDP Server received: ${msg} from ${rinfo.address}:${rinfo.port}`);

        // Process the message and update shared state
        const updatedData = processUdpMessage(
            msg,
            rinfo,
            serverContainerManager
        );

        // Emit an event for WebSocket server
        if (updatedData) {
            eventEmitter.emit("update", updatedData);
        }
    });

    server.on("listening", () => {
        const address = server.address();
        console.log(
            `UDP Server listening on ${address.address}:${address.port}`
        );
    });

    return server;
}

function processUdpMessage(msg, rinfo, serverContainerManager) {
    // UDP Incoming is processed here
    // This function should update the serverContainerManager with new data
    // and return the data that needs to be broadcasted to WebSocket clients.
    const messageData = msg.toString();
     console.log(
        `WebSocket heard and sent for processing: ${messageData} - ${rinfo.address}:${rinfo.port}`
    );

    // udpServer.js -> processServerOutput.js -> messageHandlers.js -> updaterFunctions.js
    const response = processServerOutput(
        messageData,
        rinfo.address,
        rinfo.port
    );

    if (response) {
        console.log(`Relevant message detected:`)
        console.log(response)
        serverContainerManager.updateServerData(
            response.serverKey,
            response.newData
        );
        return JSON.stringify(serverContainerManager.getAllData());
    }

    // Update the serverContainerManager accordingly

    // Return the data to be emitted
    return null;
}

export default createUdpServer;

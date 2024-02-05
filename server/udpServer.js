import dgram from "dgram";
import processServerOutput from "./processServerOutput.js";
import { getAllServerData } from "./dbHandlers/dbHandlers.js";

function createUdpServer(serverContainerManager, eventEmitter) {
    const server = dgram.createSocket("udp4");

    server.on("error", (err) => {
        console.error(`UDP Server error:\n${err.stack}`);
        server.close();
    });

    server.on("message", (msg, rinfo) => {
        /* console.log(`Got message from ${rinfo} - ${msg}`) */
        // Process incoming UDP string and update shared state
        const updatedData = processUdpMessage(
            msg,
            rinfo,
            serverContainerManager
        );

        // Emit an event for WebSocket server
        if (updatedData) {
            /*             getAllServerData().then((payload) =>
                eventEmitter.emit("update", payload)
            ); */
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
    // AND return the data that needs to be broadcasted to WebSocket clients.
    const messageData = msg.toString();
    const serverKey = rinfo.address.toString() + ":" + rinfo.port.toString();

    // udpServer.js -> processServerOutput.js -> messageHandlers.js
    const response = processServerOutput(messageData, serverKey);

    if (response) {
        serverContainerManager.updateServerData(
            response.serverKey,
            response.newData
        );
        // Not gonna send the updated data via WebSocket anymore so we can just return true to tell the emitter to go ahead and pull the full server table
        /* return serverContainerManager.getServerData(serverKey); */
        return response;
    }

    return null;
}

export default createUdpServer;

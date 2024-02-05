import WebSocket, { WebSocketServer } from "ws";
import { getAllServerData } from "./dbHandlers/dbHandlers.js";

function createWebSocketServer(
    httpServer,
    serverContainerManager,
    eventEmitter
) {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on("connection", (ws) => {
        console.log("WebSocket client connected");

        ws.on("message", (message) => {
            try {
                const decodedMessage = JSON.parse(message);
                console.log(
                    "Received message from client:",
                    decodedMessage.type
                );

                if (decodedMessage.type === "NEW_USER") {
                    // When a user establishes connection, grab the latest db data and send it over
                    getAllServerData().then((data) => broadcast(data, true));
                }
            } catch (e) {
                console.error(`Error parsing message: `, e);
            }
            // Handle incoming messages from WebSocket clients
        });

        ws.on("close", () => {
            console.log("WebSocket client disconnected");
        });
    });

    // Broadcasting the data to all connected clients
    function broadcast(data, full = false) {
        const wsPayload = JSON.stringify({ type: full ? "SERVERS" : "UPDATE" , payload: data });
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(wsPayload);
            }
        });
    }

    return {
        wss,
        broadcast,
    };
}

export default createWebSocketServer;

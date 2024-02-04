import WebSocket, { WebSocketServer } from "ws";

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
    function broadcast(data) {
        const wsPayload = JSON.stringify({ type: "SERVERS", payload: data });
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

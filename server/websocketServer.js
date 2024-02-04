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
            console.log("Received message from client:", message);
            // Handle incoming messages from WebSocket clients
        });

        ws.on("close", () => {
            console.log("WebSocket client disconnected");
        });
    });

    // Broadcasting the data to all connected clients
    function broadcast(data) {
        const wsPayload = JSON.stringify({ type: "SERVERS", payload: data });
        console.log(`Sending updated data to clients via ws: ${wsPayload}`)
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(wsPayload);
            }
        });
    }

    /*     // Listen for updates from the UDP server --- BUT this is covered in server.js so no need for it here.
    eventEmitter.on("update", (data) => {
        console.log(`websocketServer received an update event and called broadcast()`)
        broadcast(data);
    }); */

    return {
        wss,
        broadcast,
    };
}

export default createWebSocketServer;

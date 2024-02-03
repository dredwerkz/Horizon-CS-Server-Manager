import { WebSocketServer } from 'ws';

function createWebSocketServer(httpServer, serverContainerManager, eventEmitter) {
    const wss = new WebSocketServer({ server: httpServer });

    wss.on('connection', (ws) => {
        console.log('WebSocket client connected');

        ws.on('message', (message) => {
            console.log('Received message from client:', message);
            // Handle incoming messages from WebSocket clients
        });

        ws.on('close', () => {
            console.log('WebSocket client disconnected');
        });
    });

    // Broadcasting the data to all connected clients
    function broadcast(data) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    // Listen for updates from the UDP server
    eventEmitter.on('update', (data) => {
        /**console.log('Received update from UDP server:', data); */
        broadcast(data);
    });

    return {
        wss,
        broadcast
    };
}

export default createWebSocketServer;

import http from 'http';
import EventEmitter from 'events';
import createUdpServer from './server/udpServer.js';
import createWebSocketServer from './server/websocketServer.js';
import createHttpServer from './server/httpServer.js';
import ServerContainerManager from './server/serverContainerManager.js';

const eventEmitter = new EventEmitter();
const serverContainerManager = new ServerContainerManager();

const httpServer = createHttpServer(http);
const wsServer = createWebSocketServer(httpServer, serverContainerManager, eventEmitter);
const udpServer = createUdpServer(serverContainerManager, eventEmitter);

httpServer.listen(8080, () => {
    console.log('HTTP server listening on port 8080');
});

udpServer.bind(12345, () => {
    console.log('UDP server waiting...');
});

eventEmitter.on('update', (data) => {
    wsServer.broadcast(data);
});
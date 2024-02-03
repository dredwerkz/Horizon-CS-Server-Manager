import dgram from 'dgram';

function createUdpServer(serverContainerManager, eventEmitter) {
    const server = dgram.createSocket('udp4');

    server.on('error', (err) => {
        console.error(`UDP Server error:\n${err.stack}`);
        server.close();
    });

    server.on('message', (msg, rinfo) => {
        /**console.log(`UDP Server received: ${msg} from ${rinfo.address}:${rinfo.port}`); */

        // Process the message and update shared state
        const updatedData = processUdpMessage(msg, rinfo, serverContainerManager);

        // Emit an event for WebSocket server
        eventEmitter.emit('update', updatedData);
    });

    server.on('listening', () => {
        const address = server.address();
        console.log(`UDP Server listening on ${address.address}:${address.port}`);
    });

    return server;
}

function processUdpMessage(msg, rinfo, serverContainerManager) {
    // UDP Incoming is processed here
    // This function should update the serverContainerManager with new data
    // and return the data that needs to be broadcasted to WebSocket clients.

    const messageData = msg.toString();
    console.log(`WebSocket heard and sent for processing: ${messageData} - ${rinfo.address}:${rinfo.port}`)

    // Update the serverContainerManager accordingly


    // Return the data to be emitted
    return messageData; // This should be replaced with the actual data to emit
}

export default createUdpServer;

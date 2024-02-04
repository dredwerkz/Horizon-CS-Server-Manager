import messageHandlers from "./messageHandlers.js";

function processServerOutput(messageData, address, port) {
    const serverKey = address.toString() + ":" + port.toString();

    // Loop through handlers to find a match..
    for (let { regex, handler } of messageHandlers) {
        const match = messageData.toString().match(regex);
        if (match) {
            // Bundle the serverKey and match together for easier processing
            const bundle = { serverKey, match };
            return handler(bundle);
        }
    }
    return null;
}

export default processServerOutput;

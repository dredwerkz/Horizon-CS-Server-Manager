import dgram from "dgram";
const client = dgram.createSocket("udp4");

const arrayOfServerMessages = [
    `L 05/31/2023 - 22:31:56: Team "CT" scored "1" with "3" players`,
    `L 05/31/2023 - 22:31:56: Team "TERRORIST" scored "2" with "3" players`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "CT": Losers`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "TERRORIST": Legends`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Score: 6:7 on map "de_monkey" RoundsPlayed: 3`,
    `L 05/31/2023 - 22:26:43: "Supermarket Sushi<73><STEAM_1:1:16333471><CT>" say "hey we need an admin"`,
    //`admin_issue_solved`
];

const randomiser = {
    score: () => {
        return Math.floor(Math.random() * 13);
    },
    map: () => {
        const mapPicker = Math.floor(Math.random() * 7);
        switch (mapPicker) {
            case 0:
                return "de_mirage";
            case 1:
                return "de_inferno";
            case 2:
                return "de_vertigo";
            case 3:
                return "de_anubis";
            case 4:
                return "de_ancient";
            case 5:
                return "de_nuke";
            case 6:
                return "de_overpass";
            default:
                return "de_dust2";
        }
    },
    admin: () => {
        const admin = Math.floor(Math.random() * 2);
        switch (admin) {
            case 0:
                return "admin";
            case 1:
                return "redacted";
            default:
                return "redacted";
        }
    },
};



const sourcePort = 50000; // Source port
const destinationPort = 12345; // Destination port
const destinationHost = "localhost";

/*
client.bind(sourcePort, () => {
    sendMessages(0); // Start sending messages
});

function sendMessages(index) {
    if (index < arrayOfServerMessages.length) {
        let message = Buffer.from(newArrayOfServerMessages[index]);

        client.send(
            message,
            0,
            message.length,
            destinationPort,
            destinationHost,
            (err) => {
                if (err) {
                    console.error(err);
                    client.close();
                    return;
                }
                console.log("Message sent from port " + sourcePort);

                // Send the next message
                sendMessages(index + 1);
            }
        );
    } else {
        // Close the client after all messages are sent
        client.close();
    }
}
 */

function generateMessages() {
    const newArrayOfServerMessages = [
        `L 05/31/2023 - 22:31:56: Team "CT" scored "${randomiser.score()}" with "3" players`,
        `L 05/31/2023 - 22:31:56: Team "TERRORIST" scored "${randomiser.score()}" with "3" players`,
        `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "CT": Losers`,
        `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "TERRORIST": Legends`,
        `L 05/31/2023 - 22:31:56: MatchStatus: Score: 6:7 on map "${randomiser.map()}" RoundsPlayed: 3`,
        `L 05/31/2023 - 22:26:43: "Supermarket Sushi<73><STEAM_1:1:16333471><CT>" say "hey we need an ${randomiser.admin()}"`,
        //`admin_issue_solved`
    ];
    return newArrayOfServerMessages
}

async function sendMessages(client, messages, index) {
    if (index < messages.length) {
        let message = Buffer.from(messages[index]);

        client.send(
            message,
            0,
            message.length,
            destinationPort,
            destinationHost,
            (err) => {
                if (err) {
                    console.error(err);
                    client.close();
                    return;
                }
                console.log("Message sent from port " + client.address().port);

                // Send the next message
                sendMessages(client, messages, index + 1);
            }
        );
    } else {
        // Close the client after all messages are sent
        client.close();
    }
}

async function bindAndSend(startPort, numPorts) {
    for (let i = 0; i < numPorts; i++) {
        let client = dgram.createSocket('udp4');
        let messages = generateMessages(); // Generate a unique set of messages for each client
        await new Promise((resolve, reject) => {
            client.bind(startPort + i, () => {
                sendMessages(client, messages, 0).then(resolve).catch(reject);
            });
        });
    }
}

bindAndSend(sourcePort, 20);
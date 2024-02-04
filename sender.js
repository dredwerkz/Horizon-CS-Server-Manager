import dgram from "dgram";
const client = dgram.createSocket("udp4");

const arrayOfServerMessages = [
    `L 05/31/2023 - 22:31:56: Team "CT" scored "1" with "3" players`,
    `L 05/31/2023 - 22:31:56: Team "TERRORIST" scored "2" with "3" players`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "CT": Losers`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Team playing "TERRORIST": Legends`,
    `L 05/31/2023 - 22:31:56: MatchStatus: Score: 6:7 on map "de_season" RoundsPlayed: 3`,
    `L 05/31/2023 - 22:26:43: "Supermarket Sushi<73><STEAM_1:1:16333471><CT>" say "hey we need an admin"`,
    //`admin_issue_solved`
];

const sourcePort = 50000; // Source port
const destinationPort = 12345; // Destination port
const destinationHost = 'localhost';

client.bind(sourcePort, () => {
    sendMessages(0); // Start sending messages
})

function sendMessages(index) {
    if (index < arrayOfServerMessages.length) {
        let message = Buffer.from(arrayOfServerMessages[index]);
        // console.log(`Current message is: ${message}`);

        client.send(message, 0, message.length, destinationPort, destinationHost, (err) => {
            if (err) {
                console.error(err);
                client.close();
                return;
            }
            console.log("Message sent from port " + sourcePort);

            // Send the next message
            sendMessages(index + 1);
        });
    } else {
        // Close the client after all messages are sent
        client.close();
    }
}   

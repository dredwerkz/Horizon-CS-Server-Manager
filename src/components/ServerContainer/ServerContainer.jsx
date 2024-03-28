import React, {useState, useEffect, useRef} from "react";
import Server from "../Server/Server.jsx";
import "./ServerContainer.css";

function ServerContainer() {
    const [serverData, setServerData] = useState([]); // State to store serverContainer data
    const wsClient = useRef(null); // persistent WebSocket client between re-renders

    // const PORT = 8080;
    function testIncomingWSData(payload) {
        console.log(typeof payload)
    }

    function updateOrAddServerData(currentServerData, payload) {
        // Check if the serverkey exists in the current data
        const exists = currentServerData.some(
            (server) => server.ServerKey === payload.ServerKey
        );

        if (!exists) {
            // If not, add a new object with the serverkey and placeholder data
            return [
                ...currentServerData,
                {
                    ServerKey: payload.ServerKey,
                    ...placeholderData,
                    ...payload
                },
            ];
        } else {
            // If it exists, update the data
            return currentServerData.map((server) => {
                if (server.ServerKey === payload.ServerKey) {
                    let updatedServer = {
                        ...server,
                        ...payload,
                        PlayersCt: [...new Set([...(server.PlayersCt || []), ...(payload.PlayersCt || [])])],
                        PlayersT: [...new Set([...(server.PlayersT || []), ...(payload.PlayersT || [])])]
                    };


                    let {PlayersCt, PlayersT, ...restPayload} = payload;

                    return {...updatedServer, ...restPayload};
                }
                return server;
            });
        }
    }

    const placeholderData = {
        ScoreCt: 0,
        ScoreT: 0,
        Map: "de_unknown",
        Rounds: 0,
        Admin: false,
        PlayersCt: [],
        PlayersT: [],
    };

    useEffect(() => {
        initWebSocket();

        // Clean up the WebSocket connection when the component unmounts
        return () => {
            if (wsClient.current) {
                wsClient.current.close();
            }
        };
    }, []);

    function initWebSocket() {
        if (wsClient.current) {
            wsClient.current.close();
        }

        //const URL = "ws://localhost:" + PORT;
        const URL = "ws://localhost:5000/ws"
        wsClient.current = new WebSocket(URL);

        wsClient.current.onopen = (_e) => {
            wsClient.current.send(JSON.stringify({type: "NEW_USER"}));
            showMessageReceived("WebSocket connection established");
        };

        wsClient.current.onmessage = (e) => {
            const {type, payload} = JSON.parse(e.data); // Destructure the ws event data, pull the type and payload
            if (type === "SERVERS") {
                showMessageReceived(payload);
                //payload.forEach((server) => updateOrAddServerData(server))
                setServerData(payload)
            } else if (type === "UPDATE") {
                // showMessageReceived(payload);
                console.log("Received wS object is: ")
                console.log(payload)

                setServerData((currentServerData) =>
                    updateOrAddServerData(currentServerData, payload)
                );
                
            } else if (type === "NEW_USER") {
                console.log("New User acknowledged by server!")
                
            } else if (type === "ADMIN_UPDATE") {
                console.log("Admin flag switched.")
                console.log(payload)
                setServerData((currentServerData) =>
                    updateOrAddServerData(currentServerData, payload)
                )
                
            } else {
                console.log("ws Message is unhandled, check server!");
            }
        };

        wsClient.current.onclose = (e) => {
            console.log(`WebSocket Closed: code=${e.code} reason=${e.reason}`)
            showMessageReceived("No WebSocket connection :(");
        };

        wsClient.current.onerror = (e) => {
            console.error("WebSocket error observed:", e);
        };
    }

    // At some point need to build this out to be an actual handler of the data we get in. Update a data state with it, probably!
    function showMessageReceived(message) {
        console.log(message);
    }

    if (Object.keys(serverData).length > 0) {
        return (
            <div className="serverContainer">
                <h1>Active Servers:</h1>
                {serverData.map((server, i) => {
                    return (
                        <Server
                            key={"ServerInList_" + i}
                            server={server.ServerKey}
                            map={server.Map != null ? server.Map : "de_unknown"}
                            team1={server.ScoreCt != null ? server.ScoreCt : "0"}
                            team2={server.ScoreT != null ? server.ScoreT : "0"}
                            rounds={server.Rounds != null ? server.Rounds : "?"}
                            admin={server?.Admin != null ? server.Admin : false}
                            players1={server.PlayersCt != null ? server?.PlayersCt : ["Unknown"]}
                            players2={server.PlayersT != null ? server?.PlayersT : ["Unknown"]}
                            wsClient={wsClient}
                        />
                    );
                })}
            </div>
        );
    } else {
        return (
            <div className="serverContainer">
                <h1 style={{color: `white`}}>Waiting for server data...</h1>
            </div>
        );
    }
}

export default ServerContainer;

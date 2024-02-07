import React, { useState, useEffect, useRef } from "react";
import Server from "../Server/Server.jsx";
import "./ServerContainer.css";

function ServerContainer() {
    const [serverData, setServerData] = useState([]); // State to store serverContainer data
    const [refreshMsg, setRefreshMsg] = useState(false);
    const wsClient = useRef(null); // persistent WebSocket client between re-renders

    const PORT = 8080;

    const updateOrAddServerData = (currentServerData, payload) => {
        // Check if the serverkey exists in the current data
        const exists = currentServerData.some(
            (server) => server.serverkey === payload.serverkey
        );

        if (!exists) {
            // If not, add a new object with the serverkey and placeholder data
            return [
                ...currentServerData,
                {
                    serverkey: payload.serverkey,
                    ...placeholderData,
                },
            ];
        } else {
            // If it exists, update the data
            return currentServerData.map((server) => {
                if (server.serverkey === payload.serverkey) {
                    return { ...server, ...payload };
                }
                return server;
            });
        }
    };

    const placeholderData = {
        ct: 0,
        terrorist: 0,
        map: "de_unknown",
        score: 0,
        admin: false,
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

        const URL = "ws://localhost:" + PORT;
        wsClient.current = new WebSocket(URL);

        wsClient.current.onopen = (_e) => {
            wsClient.current.send(JSON.stringify({ type: "NEW_USER" }));
            showMessageReceived("WebSocket connection established");
        };

        wsClient.current.onmessage = (e) => {
            const { type, payload } = JSON.parse(e.data);
            if (type === "SERVERS") {
                showMessageReceived(payload);
                setServerData(payload);
            } else if (type === "UPDATE") {
                showMessageReceived(payload);

                setServerData((currentServerData) =>
                    updateOrAddServerData(currentServerData, payload)
                );
            } else {
                console.log("ws Message was... weird?");
            }
        };

        wsClient.current.onclose = (_e) => {
            showMessageReceived("No WebSocket connection :(");
        };

        wsClient.current.onerror = (e) => {
            console.error("WebSocket error observed:", e);
            setRefreshMsg(true);
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
                {serverData.map((server) => {
                    return (
                        <Server
                            key={server.serverkey}
                            server={server.serverkey}
                            map={server.map}
                            team1={server.terrorist}
                            team2={server.ct}
                            rounds={server.rounds}
                            admin={server?.admin}
                        />
                    );
                })}
            </div>
        );
    } else {
        return (
            <div className="serverContainer">
                <h1 style={{ color: `white` }}>Loading your server data...</h1>
            </div>
        );
    }
}

export default ServerContainer;

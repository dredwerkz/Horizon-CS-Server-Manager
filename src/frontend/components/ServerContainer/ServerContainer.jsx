import React, { useState, useEffect, useRef } from "react";
import Server from "../Server/Server.jsx";
import "./ServerContainer.css";

function ServerContainer() {
    const [serverData, setServerData] = useState({}); // State to store serverContainer data

    const wsClient = useRef(null); // Use useRef for persistent WebSocket client

    const PORT = 8080;

    useEffect(() => {
        init();

        // Clean up the WebSocket connection when the component unmounts
        return () => {
            if (wsClient.current) {
                wsClient.current.close();
            }
        };
    }, []); // Empty dependency array to run only on mount and unmount

    function init() {
        if (wsClient.current) {
            wsClient.current.close();
        }

        const URL = "ws://localhost:" + PORT;
        wsClient.current = new WebSocket(URL);

        wsClient.current.onopen = (_e) => {
            wsClient.current.send(JSON.stringify({ type: "NEW_USER" }));
            showMessageReceived("onopen triggered");
        };

        wsClient.current.onmessage = (e) => {
            const { type, payload } = JSON.parse(e.data);
            showMessageReceived(payload);
        };

        wsClient.current.onclose = (_e) => {
            showMessageReceived("No WebSocket connection :(");
        };

        wsClient.current.onerror = (e) => {
            console.error("WebSocket error observed:", e);
        };
    }

    function showMessageReceived(message) {
        console.log(message);
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch("/serverContainer.json");
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setServerData(data);
            } catch (error) {
                console.error("Fetch error:", error);
            }
        }

        fetchData();
    }, []);

    if (Object.keys(serverData).length > 0) {
        return (
            <div className="serverContainer">
                <h1>Active Servers:</h1>
                {serverData.map((server) => {
                    return (
                        <Server
                            key={server.server}
                            server={server.server}
                            map={server.map}
                            team1={server.TERRORIST}
                            team2={server.CT}
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

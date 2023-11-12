import React, { useState, useEffect } from "react";
import Server from "./Server.jsx";

function ServerContainer() {
    const [serverData, setServerData] = useState({}); // State to store serverContainer data

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
            <div className="serversContainer">
                {serverData.map((server) => {
                    return (
                        <Server
                            key={server.server}
                            server={server.server}
                            map={server.map}
                            team1={server.TERRORIST}
                            team2={server.CT}
                            rounds={server.rounds}
                        />
                    );
                })}
            </div>
        );
    } else {
        return (
            <div className="serversContainer">
                <h1>Loading your server data...</h1>
            </div>
        );
    }
}

export default ServerContainer;

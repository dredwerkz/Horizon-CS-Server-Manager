import React, { useState, useEffect } from "react";
import Server from "../Server/Server.jsx";
import "./ServerContainer.css"

function ServerContainer() {
    const [serverData, setServerData] = useState({}); // State to store serverContainer data

    const PORT = 8080

    const CLIENT = {
        MESSAGE: {
          NEW_USER: 'NEW_USER',
          NEW_MESSAGE: 'NEW_MESSAGE'
        }
      };

    let wsClient;

    function init() {
  
        // If a WebSocket connection exists already, close it
        if (wsClient) {
          wsClient.onerror = wsClient.onopen = wsClient.onclose = null;
          wsClient.close();
        }
  
        // Create a new WebSocket connection
        const URL = 'ws://localhost:' + PORT;
        wsClient = new WebSocket(URL);
  
  
        // Respond to connections by defining .onopen event handler.
        wsClient.onopen = (_e) => {
          wsClient.send(JSON.stringify({type: "NEW_USER"}))
          showMessageReceived('onopen triggered');
        }
  
        // TODO:
        // Exercise 7: Respond to messages from the server by defining the .onmessage event handler
  
        wsClient.onmessage = (e) => {
          const { type, payload } = JSON.parse(e.data)
          showMessageReceived(payload)
        }
  
        // .onclose is executed when the socket connection is closed
        wsClient.onclose = (_e) => {
          showMessageReceived('No WebSocket connection :(');
          wsClient = null;
        }
  
        // .onerror is executed when error event occurs on the WebSocket connection
        wsClient.onerror = (e) => {
          console.error("WebSocket error observed:", e);
          wsClient = null;
        }
      }

      function showMessageReceived(message) {
        console.log(message)
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

    init();

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
                <h1 style={{color: `white`}}>Loading your server data...</h1>
            </div>
        );
    }
}

export default ServerContainer;

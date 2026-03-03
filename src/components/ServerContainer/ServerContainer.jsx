import React, {useState, useEffect, useRef} from "react";
import Server from "../Server/Server.jsx";
import "./ServerContainer.css";

function ServerContainer() {
    const [serverData, setServerData] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('connecting');
    const wsClient = useRef(null);
    const reconnectAttempt = useRef(0);
    const reconnectTimer = useRef(null);
    const isUnmounting = useRef(false);

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
        isUnmounting.current = false;
        initWebSocket();

        return () => {
            isUnmounting.current = true;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
            }
            if (wsClient.current) {
                wsClient.current.close(1000, "Component unmounting");
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function scheduleReconnect() {
        if (isUnmounting.current) return;
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

        const baseDelay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000);
        const jitter = Math.random() * baseDelay * 0.2;
        const delay = baseDelay + jitter;

        console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempt.current + 1})`);
        setConnectionStatus('connecting');
        reconnectAttempt.current += 1;

        reconnectTimer.current = setTimeout(() => {
            initWebSocket();
        }, delay);
    }

    function initWebSocket() {
        if (wsClient.current && wsClient.current.readyState !== WebSocket.CLOSED) {
            wsClient.current.close();
        }

        setConnectionStatus('connecting');

        const hostname = process.env.REACT_APP_WS_HOST || window.location.hostname;
        const port = process.env.REACT_APP_WS_PORT || '5000';
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const URL = `${protocol}//${hostname}:${port}/ws`;

        console.log(`Connecting to WebSocket: ${URL}`);
        wsClient.current = new WebSocket(URL);

        wsClient.current.onopen = () => {
            setConnectionStatus('connected');
            reconnectAttempt.current = 0;
            wsClient.current.send(JSON.stringify({type: "NEW_USER"}));
            console.log("WebSocket connection established");
        };

        wsClient.current.onmessage = (e) => {
            const {type, payload} = JSON.parse(e.data);
            if (type === "SERVERS") {
                setServerData(payload);
            } else if (type === "UPDATE") {
                setServerData((currentServerData) =>
                    updateOrAddServerData(currentServerData, payload)
                );
            } else if (type === "NEW_USER") {
                console.log("New User acknowledged by server!");
            } else if (type === "ADMIN_UPDATE") {
                setServerData((currentServerData) =>
                    updateOrAddServerData(currentServerData, payload)
                );
            } else {
                console.log("ws Message is unhandled, check server!");
            }
        };

        wsClient.current.onclose = (e) => {
            console.log(`WebSocket Closed: code=${e.code} reason=${e.reason}`);
            setConnectionStatus('disconnected');
            if (e.code !== 1000 && !isUnmounting.current) {
                scheduleReconnect();
            }
        };

        wsClient.current.onerror = (e) => {
            console.error("WebSocket error observed:", e);
        };
    }

    return (
        <div className="serverContainer">
            <div className={`connectionStatus ${connectionStatus}`}>
                <span className="statusDot"></span>
                <span className="statusText">
                    {connectionStatus === 'connected' && 'Connected'}
                    {connectionStatus === 'connecting' && 'Reconnecting...'}
                    {connectionStatus === 'disconnected' && 'Disconnected'}
                </span>
            </div>

            <h1>Active Servers:</h1>

            {connectionStatus === 'connecting' && serverData.length === 0 && (
                <p className="statusMessage">Connecting to server...</p>
            )}

            {connectionStatus === 'disconnected' && serverData.length === 0 && (
                <p className="statusMessage errorMessage">
                    Unable to reach server. Retrying...
                </p>
            )}

            {connectionStatus === 'disconnected' && serverData.length > 0 && (
                <p className="statusMessage warningMessage">
                    Connection lost. Showing last known data. Reconnecting...
                </p>
            )}

            {serverData.length > 0 && serverData.map((server, i) => (
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
                    isConnected={connectionStatus === 'connected'}
                />
            ))}

            {connectionStatus === 'connected' && serverData.length === 0 && (
                <p className="statusMessage">Waiting for server data...</p>
            )}
        </div>
    );
}

export default ServerContainer;

import "./Server.css";
import { useState } from "react";

function Server(props) {
    const [dropDown, setDropDown] = useState(false);

    function copyAddress() {
        const copyText = props.server;
        navigator.clipboard.writeText(copyText);
    }

    function toggleDropDown() {
        setDropDown(!dropDown);
    }

    return (
        <div className={`individualServer ${props.admin ? "adminAlert" : ""}`} onClick={toggleDropDown}>
            <span
                className="serverIP"
                onClick={copyAddress}
                style={{ cursor: "pointer" }}
            >
                🔗 {props.server}
            </span>
            <span className="team1Score">{props.team1}</span>
            <span className="teamDivider">:</span>
            <span className="team2Score">{props.team2}</span>
            <span className="serverMap">{props.map}</span>
            {props.admin ? (
                <span className="notification">❗</span>
            ) : (
                <span className="notification">🆗</span>
            )}
            <div className="dropDown" hidden={!dropDown}>
                <span>Asd</span><br />
                <span>Asd</span><br />
                <span>Asd</span>
            </div>
        </div>
    );
}

export default Server;

import "./Server.css";
import {useEffect, useState} from "react";

function Server(props) {
    const [dropDown, setDropDown] = useState(false);
    const [adminState, setAdminState] = useState();

    useEffect(() => {
            if (props.admin) {
                setAdminState(props.admin)
            }
        }, [props.admin]
    )

    function toggleAdminFlag() {
        setAdminState(!adminState)
    }

    function copyAddress() {
        const copyText = props.server;
        navigator.clipboard.writeText(copyText);
    }

    function toggleDropDown() {
        setDropDown(!dropDown);
    }

    return (
        <div className={`individualServer ${adminState ? "adminAlert" : ""}`}>
            <span
                className="dropDownButton unselectable"
                onClick={toggleDropDown}
            >
                🔽
            </span>
            <span
                className="serverIP"
                onClick={copyAddress}
                style={{cursor: "pointer"}}
            >
                🔗 {props.server}
            </span>
            <span className="team1Score">{props.team1}</span>
            <span className="teamDivider">:</span>
            <span className="team2Score">{props.team2}</span>
            <span className="serverMap">{props.map}</span>
            <span className="notification" style={{cursor: "pointer"}}
                  onClick={toggleAdminFlag}>{adminState ? "❗" : "🆗"}</span>
            <div className="dropDown" hidden={!dropDown}>
                <div className="team1Players" hidden={!dropDown}>
                    <h4>Counter-Terrorists</h4>
                    {props.playersCt.map((player) => {
                        return <p>{player}</p>
                    })}
                </div>
                <div className="team2Players" hidden={!dropDown}>
                    <h4>Terrorists</h4>
                    {props.playersT.map((player) => {
                        return <p>{player}</p>
                    })}
                </div>
            </div>
        </div>

    )
}

export default Server;

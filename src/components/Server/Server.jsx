import "./Server.css";
import {useEffect, useState} from "react";

function Server(props) {
    const [dropDown, setDropDown] = useState(false);
    const [adminState, setAdminState] = useState(false);
    const [adminFlasher, setAdminFlasher] = useState("adminFlasher");
    const wsClient = props.wsClient;

    useEffect(() => {
        if (adminState) {
            setAdminFlasher("individualServer adminAlert");
        } 
        else {
            setAdminFlasher("individualServer")
        }
    }, [adminState])


    useEffect(() => {
            if (props.admin != null) {
                setAdminState(props.admin)
            }
            console.log("Admin flag is:")
            console.log(props.admin)
        }, [props]
    )

    function toggleAdminFlag() {
        console.log(wsClient)
        wsClient.current.send(JSON.stringify({
            type: "ADMIN_SWITCH",
            payload: {ServerKey: props.server, flag: !adminState}
        }));

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
        <div className={adminFlasher}>
            <span
                className="dropDownButton unselectable expander"
                onClick={toggleDropDown}
            >
                {dropDown ? "🔼" : "🔽"}
            </span>
            <span
                className="serverIP pointer"
                onClick={copyAddress}
            >
                🔗 {props.server}
            </span>
            <span onClick={toggleDropDown} className="team1Score expander">{props.team1}</span>
            <span onClick={toggleDropDown} className="teamDivider expander">:</span>
            <span onClick={toggleDropDown} className="team2Score expander">{props.team2}</span>
            <span onClick={toggleDropDown} className="serverMap expander">{props.map}</span>
            <span className="notification pointer"
                  onClick={toggleAdminFlag}>{adminState ? "❗" : "🆗"}</span>
            <div className="dropDown" hidden={!dropDown}>
                <div className="team1Players" hidden={!dropDown}>
                    <h4>Counter-Terrorists</h4>
                    {props.players1.map((player, i) => {
                        return <p key={"player1_" + i}>{player}</p>
                    })}
                </div>
                <div className="team2Players" hidden={!dropDown}>
                    <h4>Terrorists</h4>
                    {props.players2.map((player, i) => {
                        return <p key={"player2_" + i}>{player}</p>
                    })}
                </div>
            </div>
        </div>

    )
}

export default Server;

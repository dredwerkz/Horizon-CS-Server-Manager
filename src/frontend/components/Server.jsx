function Server(props) {
    return (
        <div className="individualServer">
           <span className="serverIP">IP: {props.server}</span>
           <span className="team1Score">CT: {props.team1}</span>
           <span className="team2Score"> T: {props.team2}</span>
           <span className="serverMap">{props.map}</span>
           <span className="notification">🆗</span>
        </div>
    )
}

export default Server
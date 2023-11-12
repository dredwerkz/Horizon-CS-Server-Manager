function Server(props) {

    function copyAddress() {
        const copyText = props.server
        navigator.clipboard.writeText(copyText)
    }


    return (
        <div className="individualServer">
           <span className="serverIP" onClick={copyAddress} style={{cursor:'pointer'}}>{props.server}</span>
           <span className="team1Score">{props.team1}</span>
           <span className="teamDivider">:</span>
           <span className="team2Score">{props.team2}</span>
           <span className="serverMap">{props.map}</span>
           <span className="notification">🆗</span>
        </div>
    )
}

export default Server
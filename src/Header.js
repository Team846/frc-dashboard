import React from 'react';

function Header(props) {
    return (<header>
        <h1>RobotDashboard</h1>
        <p className={props.connected ? "connected" : "disconnected"}>{props.connected ? "connected" : "disconnected"}</p>
    </header>)
}

export default Header
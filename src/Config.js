import React from "react";
import NetworkTables from "./Networktables"

function Config({keys}) {
    return (<div>{Object.keys(keys).map(key => <div>
        <p key={key}>{key}</p>

    </div>)}</div>)
}

export default Config
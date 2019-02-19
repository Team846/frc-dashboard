const connectionStatus = document.getElementById("connection-status");

NetworkTables.addRobotConnectionListener(connected => {
    if (connected) {
        connectionStatus.textContent = "CONNECTED";
        connectionStatus.classList.remove("disconnected");
    } else {
        connectionStatus.textContent = "NO CONNECTION";
        connectionStatus.classList.add("disconnected");
    }
});

function createElement(name, attributes, ...extras) {
    const element = document.createElement(name);
    Object.assign(element, attributes);
    extras.forEach(extra => {
        if (typeof extra === "string") {
            element.classList.add(extra);
        } else {
            if (extra instanceof Node) {
                element.append(extra);
            } else {
                element.addEventListener(extra.type, extra.run);
            }
        }
    });
    return element;
}
const connection = {
    icon: document.getElementById("connection-icon"),
    text: document.getElementById("connection-status-text")
};

NetworkTables.addRobotConnectionListener(connected => {
    connection.icon.className = connected ? "connected" : "";
    connection.text.textContent = connected ? `Connected (${NetworkTables.getRobotAddress()})` : "Connecting"
});

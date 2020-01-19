const blackoutElement = createElement("div", {}, "blackout");
const connectionStatus = document.getElementById("connection-status");

const modals = [];

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

function serializeForm() {
    const config = {};
    for (let i = 0; i < this.length; i++) {
        if (this[i].type === "number") {
            config[this[i].name] = parseFloat(this[i].value) || 0;
        } else if (this[i].type === "checkbox") {
            config[this[i].name] = this[i].checked;
        } else if (this[i].type !== "submit") {
            config[this[i].name] = this[i].value;
        }
    }
    return config;
}

function showModal(modal) {
    const autocomplete = document.getElementById("keys");
    if (autocomplete) {
        while (autocomplete.firstChild) autocomplete.removeChild(autocomplete.firstChild);
        Array.from(NetworkTables.getKeys()).forEach(key => autocomplete.append(createElement("option", {
            textContent: key
        })));
    }

    const background = createElement("div", {},
        "modal-material", modal);
    const container = createElement("div", {},
        "modal", background);

    document.body.append(blackoutElement, container);

    if (modals[modals.length - 1]) modals[modals.length - 1].style.top = "-100vh";
    modals.push(container);

    function closeModal() {
        if (modals[modals.length - 1] !== container) {
            return;
        } else {
            modals.pop();
            if (modals[modals.length - 1]) modals[modals.length - 1].style.top = 0;
        }

        document.body.removeChild(container);
        background.removeChild(modal);

        if (modals.length === 0) {
            document.body.removeChild(blackoutElement);
        }
    }

    blackoutElement.addEventListener("click", closeModal);

    return closeModal;
}

function keyDown() {
    const inputArray = document.getElementById("searchInput").value.toUpperCase().split(" ");
    const input = document.getElementById("searchInput");

    input.addEventListener("keyup", function(event) {
        if (event.code === "Enter") {
            searchAlgorithm(event, inputArray);
        }
        this.removeEventListener("keyup", arguments.callee);
    });
}

function searchAlgorithm(event, inputArray) {
    let keys = Array.from(NetworkTables.getKeys());
    const inputLength = inputArray.length;

    const result = keys.slice();
    for (let queryIndex = inputLength-1; queryIndex >= 0; queryIndex--) {
        let subResultLength = keys.length;
        let currQuery = inputArray[queryIndex];

        for (let keyIndex = 0; keyIndex < subResultLength; keyIndex++) {
            let currKey = keys[keyIndex];

            if (!(currKey.toUpperCase().includes(currQuery))) {
                result.splice(result.indexOf(currKey), 1);
            }
        }
        keys = result.slice();
    }
    showResults(result)
}

function showResults(keys) {
    const allKeys = Array.from(NetworkTables.getKeys());

    let element;
    for (let i = 0; i < allKeys.length; i++) {
        let id = NetworkTables.keyToId(allKeys[i]);
        element = document.getElementById(id);
        element.setAttribute("tabIndex", "-1");

    }

    for (let i = 0; i < keys.length; i++) {
        keys[i] = NetworkTables.keyToId(keys[i]);
        let element = document.getElementById(keys[i]);
        element.setAttribute("tabIndex", "0");
    }
}
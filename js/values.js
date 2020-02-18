const values = document.getElementById("values");

function findContainerForKey(parts) {
    const elementId = NetworkTables.keyToId(parts.join("/"));
    const container = document.getElementById(elementId);

    if (container === null) {
        let isOpen = true;

        const section = createElement("section", {
            id: elementId
        }, "table");

        const label = createElement("h1", {
            textContent: parts.pop(),

        }, "table", {
            run() {
                if (isOpen) {
                    label.classList.add("collapsed");
                    section.classList.add("collapsed");
                } else {
                    label.classList.remove("collapsed");
                    section.classList.remove("collapsed");
                }

                isOpen = !isOpen;
            },
            type: "click"
        });

        const fragment = document.createDocumentFragment();
        fragment.append(label, section);

        if (parts.length === 1) {
            values.append(fragment);
        } else {
            const parent = findContainerForKey(parts);
            parent.append(fragment);
        }

        return section;
    } else {
        return container;
    }
}

const timeouts = {};

function subscribeToNetworkTables() {
    return NetworkTables.addGlobalListener((key, value, isNew) => {
        const keyButAnArray = key.split("/"), name = keyButAnArray.pop(), id = NetworkTables.keyToId(key);

        if (isNew) {
            let newValue;
            let input = createElement();
            if (typeof value === 'number') {
                input = createElement("input", {
                    disabled: typeof value === "object",
                    id,
                    step: "any",
                    type: "number",
                    value: value,
                }, "entry", {
                    run(e) {
                        newValue = e.target.type === "number" ? parseFloat(e.target.value) : e.target.value;
                        document.getElementById(input.id+"-label").classList.add("unsent");
                    },
                    type: "change"
                }, {
                    run() {
                        isFocused(input, key);
                    }, type: "focus"
                }, {
                    run() {
                        isHovered(key);
                    }, type: "mouseover"
                });
            } else {
                input = createElement("select", {
                    disabled: typeof value === "object",
                    id,
                }, "entry", {
                    run(e) {
                        newValue = e.target.selectedIndex === 0;
                        document.getElementById(input.id+"-label").classList.add("unsent");
                    },
                    type: "change"
                }, {
                    run() {
                        isFocused(input, key);
                    }, type: "focus"
                }, {
                    run() {
                        isHovered(key);
                    }, type: "mouseover"
                });
                input.insertAdjacentHTML("beforeend", "<option value = 'True'>True</option>");
                input.insertAdjacentHTML("beforeend", "<option value = 'False'>False</option>");
                input.selectedIndex = value ? 0 : 1;
            }


            const getIcon = createElement("i", {}, "fas", "fa-sync");
            const getButton = createElement("div", {}, "get-button", getIcon, {
                async run() {
                    if (entry.querySelector(".get-value-label") !== null) return;
                    const response = await fetch("/networktables/get-value?key=" + key);
                    const value = CBOR.decode(await response.arrayBuffer());
                    const valueLabel = createElement("div", {
                        textContent: "(" + value + ")",
                    }, "get-value-label");
                    entry.append(valueLabel);
                    window.setTimeout(function () {
                        entry.removeChild(valueLabel);
                    }, 2000);
                    alert(key + "\n\nValue: " + value);
                },
                type: "click"
            });

            const sendIcon = createElement("i", {}, "far", "fa-paper-plane");
            const sendButton = createElement("div", {}, "send-button", sendIcon, {
                run() {
                    NetworkTables.putValue(key, newValue);
                    document.getElementsByClassName("unsent")[0].classList.remove("unsent");
                },
                type: "click"
            });

            const label = createElement("label", {
                htmlFor: id,
                id: `${id}-label`,
                textContent: name
            }, "entry", input, {
                run() {
                    isHovered(key);
                }, type: "mouseover"
            });

            const entry = createElement("div", {}, "entry", label, sendButton, getButton);

            const container = findContainerForKey(keyButAnArray);
            container.append(entry);
        } else {
            const input = document.getElementById(id);
            if (input !== document.activeElement) {
                if (typeof value === "boolean") {
                    input.selectedIndex = value ? 0 : 1;
                } else {
                    input.value = value;
                }

                const label = document.getElementById(`${id}-label`);
                label.classList.add("changed");

                clearTimeout(timeouts[id]);
                timeouts[id] = setTimeout(() => {
                    label.classList.remove("changed");
                }, 1000);
            }
        }
    }, true);
}

let unsub = () => {};

document.getElementById("download-nt-config").addEventListener("click", e => {
    window.open("/networktables/backup")
});

document.getElementById("upload-nt-config").addEventListener("change", e => {
    if (e.target.files[0]) {
        const reader = new FileReader();
        reader.addEventListener("load", e => {
            const backup = CBOR.decode(reader.result);
            Object.keys(backup).forEach(key => {
                NetworkTables.putValue(key, backup[key]);
            });
        });
        reader.readAsArrayBuffer(e.target.files[0]);
    }
});

function download(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function isFocused(input, key) {
    const mostRecent = document.getElementsByClassName("selected");
    if (mostRecent.length > 0) {
        mostRecent[0].classList.remove("selected");
    }

    const element = document.getElementById(input.id+"-label");
    element.classList.add("selected");

    const stickyHeader = document.getElementById("stickyHeader");
    stickyHeader.innerHTML = key;
}

function isHovered(key) {
    const header = document.getElementById("stickyHeader");
    const selected = document.getElementsByClassName("selected");

    if (selected.length > 0) {
        const elementHeight = selected[0].getBoundingClientRect().top;

        if (elementHeight > window.innerHeight || elementHeight < 0) {
            header.innerHTML = key;
        }
    } else {
        header.innerHTML = key;
    }
}

NetworkTables.addRobotConnectionListener(connected => {
    if (connected === false) {
        console.info("Disconnected from robot, disabling inputs");
        unsub();
        document.querySelectorAll("#values input").forEach(it => {
            it.disabled = true;
        });
    } else {
        while (values.firstChild) values.removeChild(values.firstChild);
        unsub = subscribeToNetworkTables();
    }
});

document.getElementById("searchInput").addEventListener("input", e => {
    keyDown(e);
});

function keyDown(e) {
    let value = document.getElementById("searchInput").value;
    const inputArray = value.toUpperCase().split(" ");
    searchAlgorithm(e, inputArray);
}

function searchAlgorithm(event, inputArray) {
    // keys are like a "dictionary"
    let keys = Array.from(NetworkTables.getKeys());

    const inputLength = inputArray.length;
    const result = keys.slice();
    for (let queryIndex = inputLength - 1; queryIndex >= 0; queryIndex--) {
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
    showResults(result);
}

function showResults(keys) {
    document.querySelectorAll('label.entry').forEach(it => it.style.display = "none");
    document.querySelectorAll('div.send-button').forEach(it => it.style.display = "none");
    document.querySelectorAll('div.get-button').forEach(it => it.style.display = "none");

    keys.map(NetworkTables.keyToId).forEach(id => {
        document.getElementById(`${id}-label`).style.display = "block";
    });
}
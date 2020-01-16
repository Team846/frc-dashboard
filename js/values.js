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
            textContent: parts.pop()
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
            const input = createElement("input", {
                checked: value,
                disabled: typeof value === "object",
                id,
                step: typeof value === "number" ? "any" : undefined,
                type: {
                    boolean: "checkbox",
                    number: "number"
                }[typeof value],
                value: value,
            }, "entry", {
                run(e) {
                    newValue = e.target.type === "checkbox" ? e.target.checked : (e.target.type === "number" ? parseFloat(e.target.value) : e.target.value);
                    console.log(input.id+"-label");
                    document.getElementById(input.id+"-label").classList.add("unsent");
                },
                type: "change"
            }, {
                run() {
                    const mostRecent = document.getElementsByClassName("selected");
                    console.log(mostRecent);
                    console.log(typeof mostRecent);
                    if (mostRecent.length > 0) {
                        mostRecent[0].classList.remove("selected");
                    }

                    document.getElementById(input.id+"-label").classList.add("selected");
                }, type: "focus"
            });


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

            const sendIcon = createElement("i", {}, "far", "fa-paper-plane")
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
            }, "entry", input);

            const entry = createElement("div", {}, "entry", label, sendButton, getButton);

            const container = findContainerForKey(keyButAnArray);
            container.append(entry);
        } else {
            const input = document.getElementById(id);
            if (input !== document.activeElement) {
                if (typeof value === "boolean") {
                    input.checked = value;
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
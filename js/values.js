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

NetworkTables.addGlobalListener((key, value, isNew) => {
    const keyButAnArray = key.split("/"), name = keyButAnArray.pop(), id = NetworkTables.keyToId(key);

    if (isNew) {
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
                const newValue = e.target.type === "checkbox" ? e.target.checked : (e.target.type === "number" ? parseFloat(e.target.value) : e.target.value);
                NetworkTables.putValue(key, newValue);
            },
            type: "change"
        });

        const label = createElement("label", {
            htmlFor: id,
            id: `${id}-label`,
            textContent: name
        }, "entry", input);

        const entry = createElement("div", {}, "entry", label);

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
    if (value === Infinity) console.debug(key, value);
});

document.getElementById("download-nt-config").addEventListener("click", e => {

});
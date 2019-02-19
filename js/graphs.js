const autocomplete = document.getElementById("keys");
const graphs = document.getElementById("graphs");
const search = document.getElementById("search");
const form = document.getElementById("search-form");
const blackout = document.getElementById("blackout");
const modal = document.getElementById("modal");
const yMin = document.getElementById("y-min");
const yMax = document.getElementById("y-max");

const charts = {};

search.addEventListener("focusin", function() {
    // noinspection StatementWithEmptyBodyJS
    while (autocomplete.firstChild && autocomplete.removeChild(autocomplete.firstChild)) ;
    NetworkTables.getKeys().forEach(key => {
        autocomplete.append(createElement("option", {
            textContent: key
        }));
    });
});

form.addEventListener("submit", function(e) {
    e.preventDefault();
    const key = search.value;
    if (NetworkTables.containsKey(key) === false) return;
    if (charts[key]) {
        document.getElementById(key).scrollIntoView({
            behavior: "smooth"
        });
        return;
    }

    const canvas = createElement("canvas", {}, "graph");

    const chart = new Chart(canvas, {
        data: {
            datasets: [{
                label: key,
                data: [],
            }]
        },
        options: {
            animation: false,
            scales: {
                yAxes: [{
                    ticks: {}
                }],
                xAxes: [{
                    display: false,
                    type: 'time',
                    time: {
                        unit: 'millisecond'
                    }
                }]
            },
            tooltips: {
                enabled: false
            }
        },
        type: 'line'
    });

    const container = createElement("div", {
        id: key
    }, canvas, "graph-container");

    const gutter =
        createElement("div", {},
            createElement("button", {},
                createElement("i", {}, "fas", "fa-pause"),
                document.createTextNode("pause"),
                "play-pause", {
                    run(e) {
                        charts[key].update = !charts[key].update;
                        e.target.innerHTML = `<!--suppress CheckTagEmptyBody --><i class="fas fa-${charts[key].update ? "pause" : "play"}"></i>${charts[key].update ? "Pause" : "Play"}`;
                    },
                    type: "click"
                }),
            createElement("button", {},
                createElement("i", {}, "fas", "fa-cog"),
                document.createTextNode("settings"),
                "settings", {
                    run() {
                        blackout.style.display = "block";
                        modal.style.display = "flex";
                        yMin.onchange = () => {
                            chart.options.scales.yAxes[0].ticks.min = parseFloat(yMin.value) || 0;
                        };
                        yMax.onchange = () => {
                            chart.options.scales.yAxes[0].ticks.max = parseFloat(yMax.value);
                        }
                    },
                    type: "click"
                }),
            createElement("button", {},
                createElement("i", {}, "fas", "fa-trash"),
                document.createTextNode("delete"),
                "delete", {
                    run() {
                        charts[key].delete = true;
                        container.parentNode.removeChild(container);
                    },
                    type: "click"
                }),
            "graph-gutter");

    container.append(gutter);

    graphs.append(container);

    charts[key] = {
        chart: chart,
        update: true
    };

    function render() {
        if (charts[key].update) {
            const data = chart.data.datasets[0].data;
            data.push({
                t: new Date(),
                y: NetworkTables.getValue(key, 0)
            });

            while (data[0].t < new Date(Date.now() - 2 * 1000)) data.splice(0, 1);

            chart.update();
        }

        if (!charts[key].delete) {
            requestAnimationFrame(render);
        } else {
            charts[key] = undefined;
        }
    }

    requestAnimationFrame(render);
});

blackout.addEventListener("click", () => {
    blackout.style.display = "none";
    modal.style.display = "none";
});
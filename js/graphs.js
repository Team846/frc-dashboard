const charts = [];

const graphs = document.getElementById("graphs");
const localGraphs = JSON.parse(localStorage.getItem("local-graphs")) || [];
const newGraphButton = document.getElementById("new-graph");

function createLineChartConfig(config = {
    key: "",
    minY: 0,
    maxY: 100,
    trailSize: 2
}) {
    const keyInput = createElement("input", {
        name: "key",
        value: config.key
    });
    keyInput.setAttribute("list", "keys");
    return [
        createElement("label", {
            textContent: "Key"
        }, keyInput),
        createElement("label", {
                textContent: "Minimum"
            },
            createElement("input", {
                name: "minY",
                type: "number",
                value: config.minY
            })
        ),
        createElement("label", {
                textContent: "Maximum"
            },
            createElement("input", {
                name: "maxY",
                type: "number",
                value: config.maxY
            })
        ),
        createElement("label", {
                textContent: "Show last (seconds)"
            },
            createElement("input", {
                name: "trailSize",
                type: "number",
                value: config.trailSize
            })
        )
    ];
}

function create2dChartConfig(config = {
    keyX: "/SmartDashboard/Drivetrain/X Location (Foot)",
    minX: -20,
    maxX: 20,
    keyY: "/SmartDashboard/Drivetrain/Y Location (Foot)",
    minY: -20,
    maxY: 20,
    trailSize: 2
}) {
    const keyInputX = createElement("input", {
        name: "keyX",
        value: config.keyX
    });
    keyInputX.setAttribute("list", "keys");
    const keyInputY = createElement("input", {
        name: "keyY",
        value: config.keyY
    });
    keyInputY.setAttribute("list", "keys");
    return [
        createElement("label", {
            textContent: "Horizontal axis"
        }, keyInputX),
        createElement("label", {
                textContent: "Minimum X"
            },
            createElement("input", {
                name: "minX",
                type: "number",
                value: config.minX
            })
        ),
        createElement("label", {
                textContent: "Maximum X"
            },
            createElement("input", {
                name: "maxX",
                type: "number",
                value: config.maxX
            })
        ),
        createElement("label", {
            textContent: "Vertical axis"
        }, keyInputY),
        createElement("label", {
                textContent: "Minimum Y"
            },
            createElement("input", {
                name: "minY",
                type: "number",
                value: config.minY
            })
        ),
        createElement("label", {
                textContent: "Maximum Y"
            },
            createElement("input", {
                name: "maxY",
                type: "number",
                value: config.maxY
            })
        ),
        createElement("label", {
                textContent: "Show last (seconds)"
            },
            createElement("input", {
                name: "trailSize",
                type: "number",
                value: config.trailSize
            })
        )
    ];
}

newGraphButton.addEventListener("click", e => {
    let closeModal;

    const lineChartElements = createLineChartConfig();
    const chart2dElements = create2dChartConfig();

    const container = createElement("div", {}, ...lineChartElements);

    const form =
        createElement("form", {},
            container,
            createElement("input", {
                id: "is-2d-toggle",
                name: "is2d",
                type: "checkbox"
            }, {
                run(e) {
                    while (container.firstChild) container.removeChild(container.firstChild);
                    if (e.target.checked) {
                        container.append(...chart2dElements);
                    } else {
                        container.append(...lineChartElements);
                    }
                },
                type: "change"
            }),
            createElement("label", {
                htmlFor: "is-2d-toggle",
                textContent: "2D Graph"
            }),
            createElement("div", {},
                createElement("button", {
                    textContent: "Create",
                    type: "submit"
                }), "gutter"),
            {
                run(e) {
                    e.preventDefault();
                    const config = serializeForm.call(this);
                    createGraphFromConfig(config);
                    localGraphs.push(config);
                    localStorage.setItem("local-graphs", JSON.stringify(localGraphs));
                    closeModal();
                },
                type: "submit"
            });

    closeModal = showModal(form);
});

function createGraphFromConfig(config) {
    const chartConfig = {
        buffer: [],
        config,
        update: true
    };

    const canvas = createElement("canvas", {});

    const container = createElement("div", {}, canvas, "graph");

    const gutter =
        createElement("div", {},
            createElement("button", {},
                createElement("i", {}, "fas", "fa-pause"),
                document.createTextNode("pause"),
                "play-pause", {
                    run(e) {
                        chartConfig.update = !chartConfig.update;
                        const playPause = chartConfig.update ? "pause" : "play";
                        while (e.target.firstChild) e.target.removeChild(e.target.firstChild);
                        e.target.append(
                            createElement("i", {}, "fas", `fa-${playPause}`),
                            document.createTextNode(playPause)
                        );
                    },
                    type: "click"
                }),
            createElement("button", {},
                createElement("i", {}, "fas", "fa-cog"),
                document.createTextNode("settings"),
                "settings", {
                    run() {
                        let closeModal;

                        let container;
                        if (config.is2d) {
                            container = createElement("div", {}, ...create2dChartConfig(chartConfig.config));
                        } else {
                            container = createElement("div", {}, ...createLineChartConfig(chartConfig.config));
                        }

                        const form =
                            createElement("form", {},
                                container,
                                createElement("div", {},
                                    createElement("button", {
                                        textContent: "Update",
                                        type: "submit"
                                    }), "gutter"),
                                {
                                    run(e) {
                                        e.preventDefault();
                                        Object.assign(chartConfig.config, serializeForm.call(this));
                                        localStorage.setItem("local-graphs", JSON.stringify(localGraphs));
                                        closeModal();
                                    },
                                    type: "submit"
                                });

                        closeModal = showModal(form);
                    },
                    type: "click"
                }),
            createElement("button", {},
                createElement("i", {}, "fas", "fa-trash"),
                document.createTextNode("delete"),
                "delete", {
                    run() {
                        charts.splice(charts.indexOf(chartConfig), 1);
                        graphs.removeChild(container);
                        localStorage.setItem("local-graphs", JSON.stringify(localGraphs.filter(it => it !== config)));
                    },
                    type: "click"
                }),
            "gutter");

    container.append(gutter);

    Object.assign(chartConfig, {
        canvas,
        container,
        context: canvas.getContext('2d')
    });

    charts.push(chartConfig);

    if (!config.is2d) {
        chartConfig.chart = new Chart(canvas, {
            data: {
                datasets: [{
                    label: config.key,
                    data: [],
                }]
            },
            options: {
                animation: false,
                scales: {
                    yAxes: [{
                        ticks: {
                            suggestedMin: config.minY,
                            suggestedMax: config.maxY
                        }
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
    }

    graphs.append(container);

    if (config.is2d) {
        canvas.width = 634;
        canvas.height = 317;
    }
}

function render() {
    charts.forEach(chart => {
        if (chart.update) {
            if (chart.config.is2d) {
                chart.buffer.push({
                    t: new Date(),
                    v: [
                        NetworkTables.getValue(chart.config.keyX, 0),
                        NetworkTables.getValue(chart.config.keyY, 0)
                    ]
                });
                while (chart.buffer[0] && chart.buffer[0].t < new Date(Date.now() - chart.config.trailSize * 1000)) {
                    chart.buffer.splice(0, 1);
                }
                const ctx = chart.context;
                ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
                const optimized = {
                    xDenominator: (chart.config.maxX - chart.config.minX) / chart.canvas.width,
                    yDenominator: (chart.config.maxY - chart.config.minY) / chart.canvas.height
                };
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.moveTo(-chart.config.minX / optimized.xDenominator, 0);
                ctx.lineTo(-chart.config.minX / optimized.xDenominator, chart.canvas.height);
                ctx.stroke();
                ctx.closePath();
                ctx.beginPath();
                ctx.moveTo(0, chart.canvas.height + chart.config.minY / optimized.yDenominator);
                ctx.lineTo(chart.canvas.width, chart.canvas.height + chart.config.minY / optimized.yDenominator);
                ctx.stroke();
                ctx.closePath();
                chart.buffer.forEach(({t, v}, i) => {
                    let [x, y] = v;
                    x = (x - chart.config.minX) / optimized.xDenominator;
                    y = (y - chart.config.minY) / optimized.yDenominator;
                    ctx.fillStyle = `rgba(0, 0, 0, ${i / chart.buffer.length})`;
                    ctx.beginPath();
                    ctx.arc(x, chart.canvas.height - y, 5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath();
                });
            } else {
                chart.chart.options.scales.yAxes[0].ticks = {
                    suggestedMax: chart.config.maxY,
                    suggestedMin: chart.config.minY
                };
                const data = chart.chart.data.datasets[0].data;
                data.push({
                    t: new Date(),
                    y: NetworkTables.getValue(chart.config.key)
                });
                while (data[0] && data[0].t < new Date(Date.now() - chart.config.trailSize * 1000)) {
                    data.splice(0, 1);
                }
                chart.chart.update();
            }
        }
    });

    requestAnimationFrame(render);
}

requestAnimationFrame(render);

NetworkTables.addRobotConnectionListener(connected => {
    if (connected) {
        localGraphs.forEach(createGraphFromConfig);
    }
});

window.App = window.App || {};

/**
 * Yes, that's a Chart!
 *
 * {@link: https://github.com/chartjs/Chart.js}
 */
window.App.Chart = function (el) {
    this.el = el;

    this.config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    backgroundColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    borderColor: '#B0C4F6',
                    pointBorderColor: '#4F78E2',
                    pointHoverBorderColor: '#4F78E2',
                    pointBorderWidth: 3,
                    pointRadius: 5,
                    pointHoverRadius: 5,
                    data: [],
                    borderWidth: 2,
                    fill: false,
                    tension: 0, // Bezier curve tension of the line
                },
            ],
        },
        options: {
            plugins: {
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(79, 120, 226, 0.85)',
                    titleFont: {
                        style: 'normal',
                        color: '#000',
                    },
                    bodyFont: {
                        style: 'normal',
                        color: '#fff',
                        size: 12,
                    },
                    borderColor: 'rgba(0,0,0,0)',
                    borderWidth: 2,
                    cornerRadius: 2,
                    padding: 10,
                    callbacks: {
                        title: () => '',
                        label: (tooltipItem) => App.Utils.formatPrice(tooltipItem.parsed.y),
                    },
                    displayColors: false,
                },
                legend: {
                    display: false,
                },
            },
            layout: {
                padding: {
                    left: 40,
                    right: 40,
                    top: 10,
                    bottom: 0,
                },
            },
            responsive: true,
            hover: {
                mode: 'nearest',
                intersect: true,
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false,
                    },
                    ticks: {
                        color: '#333',
                    },
                },
                y: {
                    display: false,
                    grid: {
                        display: false,
                    },
                    ticks: {
                        callback: (value) => `$${value}`,
                    },
                },
            },
        },
    };
};

window.App.Chart.prototype.isInitiated = function () {
    return !!this.chartInstance;
};

window.App.Chart.prototype.update = function (_labels, _data) {
    this.chartInstance.data.labels = _labels;
    this.chartInstance.data.datasets[0].data = _data;

    this.chartInstance.update();
};

window.App.Chart.prototype.prepareData = function (_data) {
    let labels = [];
    let values = [];

    _data.forEach((dataPoint) => {
        labels.push(dataPoint.timestamp);
        values.push(dataPoint.value);
    });

    return {
        values,
        labels,
    };
};

/**
 * Make tooltips always visible.
 * https://github.com/chartjs/Chart.js/issues/1861
 */
window.App.Chart.prototype.alwaysVisibleTooltipsPlugin = function () {
    const plugin = {
        id: 'alwaysVisibleTooltips',
        beforeRender: (chart) => {
            if (chart.config.options.showAllTooltips) {
                chart.pluginTooltips = [];
                chart.config.data.datasets.forEach((dataset, i) => {
                    const tooltipsMaxValue = Math.max(...dataset.data);
                    const tooltipsMinValue = Math.min(...dataset.data);

                    let tooltipsMaxValueDisplayed = false;
                    let tooltipsMinValueDisplayed = false;

                    const displayTooltipsFilter = (value) => {
                        if (value === tooltipsMaxValue && !tooltipsMaxValueDisplayed) {
                            tooltipsMaxValueDisplayed = true;
                            return true;
                        } else if (value === tooltipsMinValue && !tooltipsMinValueDisplayed) {
                            tooltipsMinValueDisplayed = true;
                            return true;
                        }
                        return false;
                    };

                    chart.getDatasetMeta(i).data.forEach((sector, j) => {
                        const toolTipValue = dataset.data[j];

                        if (displayTooltipsFilter(toolTipValue)) {
                            chart.pluginTooltips.push(
                                new Chart.Tooltip({
                                    chart,
                                    tooltipItems: [
                                        { element: sector, datasetIndex: i, dataIndex: j },
                                    ],
                                    options: chart.options.plugins.tooltip,
                                })
                            );
                        }
                    });
                });

                chart.options.plugins.tooltip.enabled = false;
            }
        },
        afterDraw: (chart, easing) => {
            if (chart.config.options.showAllTooltips) {
                chart.options.plugins.tooltip.enabled = true;

                Chart.helpers.each(chart.pluginTooltips, (tooltip) => {
                    tooltip.initialize();
                    tooltip.update();
                    tooltip.pivot();
                    tooltip.transition(easing).draw();
                });
                chart.options.plugins.tooltip.enabled = true;
            }
        },
    };

    Chart.register(plugin);
};

window.App.Chart.prototype.init = function (_data) {
    const { labels, values } = this.prepareData(_data);

    // If already initiated - do not init twice! Update data only.
    if (this.isInitiated()) {
        this.update(labels, values);
        return;
    }

    this.alwaysVisibleTooltipsPlugin();

    this.config.data.labels = labels;
    this.config.data.datasets[0].data = values;

    const ctx = this.el.getContext('2d');
    this.chartInstance = new Chart(ctx, this.config);
};

window.App.Chart.prototype.destroy = function () {
    if (!this.isInitiated()) {
        return;
    }

    this.chartInstance.destroy();
};

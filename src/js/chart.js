window.App = window.App || {};

/**
 * Yes, that's a Chart!
 *
 * {@link: https://github.com/chartjs/Chart.js}
 */
window.App.Chart = function(el) {
    this.el = el;

    this.config = {
        type: 'line',

        data: {
            labels: [],
            datasets: [{
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
                // Bezier curve tension of the line
                lineTension: 0
            }]
        },
        options: {
            showAllTooltips: true,
            layout: {
                padding: {
                    left: 40,
                    right: 40,
                    top: 10,
                    bottom: 0
                }
            },
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(79, 120, 226, 0.85)',
                titleFontStyle: 'normal',
                titleFontColor: '#000',
                bodyFontColor: '#fff',
                bodyFontStyle: 'normal',
                borderColor: 'rgba(0,0,0,0)',
                borderWidth: 2,
                cornerRadius: 2,
                caretPadding: 10,
                xPadding: 5,
                yPadding: 5,
                caretSize: 10,
                bodyFontSize: 12,
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: tooltipItem => App.Utils.formatPrice(tooltipItem.yLabel)
                }
            },
            legend: {
                display: false
            },
            hover: {
                mode: 'nearest',
                intersect: true
            },
            scales: {
                xAxes: [{
                    display: true,
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        fontColor: '#333'
                    }
                }],
                yAxes: [{
                    display: false,
                    gridLines: {
                        display: false
                    },
                    ticks: {
                        // Include a dollar sign in the ticks
                        callback: value => `$${value}`
                    }
                }]
            }
        }
    };
}

window.App.Chart.prototype.isInitiated = function() {
    return !! this.chartInstance;
}

window.App.Chart.prototype.update = function(_labels, _data) {
    this.chartInstance.data.labels = _labels;
    this.chartInstance.data.datasets[0].data = _data;

    this.chartInstance.update();
}

window.App.Chart.prototype.prepareData = function(_data) {
    let labels = [];
    let values = [];

    _data.forEach( dataPoint => {
        labels.push(dataPoint.timestamp);
        values.push(dataPoint.value);
    });

    return {
        values,
        labels
    };
}

/**
 * Make tooltips always visible.
 * https://github.com/chartjs/Chart.js/issues/1861
 */
window.App.Chart.prototype.alwaysVisibleTooltipsPlugin = function() {
    Chart.pluginService.register({
        beforeRender: function (chart) {
            // Bug fix: Do not re-render tooltips on tooltip :hover
            if (chart.chartDrawnIdNastyJumpBugFix === chart.config.data.labels.join('')) {
                return;
            }

            if (chart.config.options.showAllTooltips) {
                // create an array of tooltips
                // we can't use the chart tooltip because there is only one tooltip per chart
                chart.pluginTooltips = [];
                chart.config.data.datasets.forEach(function (dataset, i) {
                    /**
                     * Display only the tooltips with the min and the max values.
                     * Filter out all the rest.
                     */
                    const tooltipsMaxValue = Math.max(...dataset.data);
                    const tooltipsMinValue = Math.min(...dataset.data);

                    const displayTooltipsFilter = (value) => (
                        value === tooltipsMaxValue || value === tooltipsMinValue
                    );

                    chart.getDatasetMeta(i).data.forEach(function (sector, j) {
                        const toolTipValue = dataset.data[j];

                        if (displayTooltipsFilter(toolTipValue)) {
                            chart.pluginTooltips.push(new Chart.Tooltip({
                                _chart: chart.chart,
                                _chartInstance: chart,
                                _data: chart.data,
                                _options: chart.options.tooltips,
                                _active: [sector]
                            }, chart));
                        }
                    });

                    chart.chartDrawnIdNastyJumpBugFix = chart.config.data.labels.join('');
                });

                // turn off normal tooltips
                chart.options.tooltips.enabled = false;
            }
        },
        afterDraw: function (chart, easing) {
            if (chart.config.options.showAllTooltips) {
                // we don't want the permanent tooltips to animate, so don't do anything till the animation runs atleast once
                // if (!chart.allTooltipsOnce) {
                //     if (easing !== 1)
                //         return;
                //     chart.allTooltipsOnce = true;
                // }

                // turn on tooltips
                chart.options.tooltips.enabled = true;

                Chart.helpers.each(chart.pluginTooltips, function (tooltip, i) {
                    tooltip.initialize();
                    tooltip.update();
                    // we don't actually need this since we are not animating tooltips
                    tooltip.pivot();
                    tooltip.transition(easing).draw();
                });
                chart.options.tooltips.enabled = true;
            }
        }
    });
};

window.App.Chart.prototype.init = function(_data) {
    const { labels, values } = this.prepareData(_data);

    // If already initiated - do not init twice! Update data only.
    if (this.isInitiated()) {
        this.update(labels, values);

        return;
    }

    this.alwaysVisibleTooltipsPlugin();

    this.config.data.labels = labels;
    this.config.data.datasets[0].data = values;

    var ctx = this.el.getContext('2d');
    this.chartInstance = new Chart(ctx, this.config);
}

window.App.Chart.prototype.destroy = function() {
    if (! this.isInitiated()) {
        return;
    }

    this.chartInstance.destroy();
}

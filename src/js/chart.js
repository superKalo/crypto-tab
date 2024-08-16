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
                    pointHoverBorderWidth: 3,
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
            showAllTooltips: true,
            plugins: {
                tooltip: {
                    multiple: true,
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
                    cornerRadius: 1,
                    padding: 4,
                    caretPadding: 10,
                    caretSize: 11,
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
                        // Include a dollar sign in the ticks
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

window.App.Chart.prototype.alwaysVisibleTooltipsPlugin = function () {
    const plugin = {
        id: 'alwaysVisibleTooltips',
        afterDraw: (chart) => {
            if (!chart.config.options.showAllTooltips) {
                return;
            }

            const ctx = chart.ctx;
            const dataset = chart.config.data.datasets[0];
            const data = dataset.data;
            const maxValue = Math.max(...data);
            const minValue = Math.min(...data);

            let foundMax = false;
            let foundMin = false;
            const permanentTooltips = [];

            // Find min and max values
            chart.config.data.datasets.forEach((dataset, datasetIndex) => {
                const meta = chart.getDatasetMeta(datasetIndex);

                meta.data.forEach((element, index) => {
                    const value = data[index];

                    if (value === maxValue && !foundMax) {
                        foundMax = true;
                        permanentTooltips.push({
                            datasetIndex,
                            index,
                            element,
                        });
                    } else if (value === minValue && !foundMin) {
                        foundMin = true;
                        permanentTooltips.push({
                            datasetIndex,
                            index,
                            element,
                        });
                    }

                    // Stop checking if both min and max are found
                    if (foundMax && foundMin) {
                        return;
                    }
                });
            });

            // Draw permanent tooltips
            permanentTooltips.forEach(({ datasetIndex, index, element }) => {
                const tooltipPosition = element.tooltipPosition();
                const value = chart.config.data.datasets[datasetIndex].data[index];
                const formattedValue = App.Utils.formatPrice(value);

                // Calculate tooltip dimensions
                ctx.font = '12px Arial';
                const textMetrics = ctx.measureText(formattedValue);
                const tooltipWidth = textMetrics.width + 7; // Plus some padding
                const tooltipHeight = 22;

                // Determine whether to place the tooltip on the left or right
                const chartWidth = chart.width;
                let tooltipX;
                const tooltipY = tooltipPosition.y - tooltipHeight / 2;

                if (tooltipPosition.x > chartWidth / 2) {
                    // Position tooltip to the left + some padding
                    tooltipX = tooltipPosition.x - tooltipWidth - 22;
                } else {
                    // Position tooltip to the right + some padding
                    tooltipX = tooltipPosition.x + 22;
                }

                // Draw tooltip background
                ctx.save();
                ctx.fillStyle = 'rgba(79, 120, 226, 0.85)';
                ctx.beginPath();
                ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 1);
                ctx.fill();

                // Draw tooltip text
                ctx.fillStyle = '#fff';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(
                    formattedValue,
                    tooltipX + tooltipWidth / 2,
                    tooltipY + tooltipHeight / 2
                );

                // Draw tooltip arrow
                ctx.fillStyle = 'rgba(79, 120, 226, 0.85)';
                ctx.beginPath();

                /** Positions are like this:
                 * 1. Top corner of the tooltip
                 * 2. Pointing to the point
                 * 3. Bottom corner of the tooltip
                 */
                if (tooltipPosition.x > chartWidth / 2) {
                    // Arrow pointing right
                    ctx.moveTo(tooltipX + tooltipWidth - 0.2, tooltipY);
                    ctx.lineTo(tooltipX + tooltipWidth + 12, tooltipPosition.y);
                    ctx.lineTo(tooltipX + tooltipWidth - 0.2, tooltipY + tooltipHeight);
                } else {
                    // Arrow pointing left
                    ctx.moveTo(tooltipX + 0.3, tooltipY);
                    ctx.lineTo(tooltipX - 12, tooltipPosition.y);
                    ctx.lineTo(tooltipX + 0.3, tooltipY + tooltipHeight);
                }

                ctx.closePath();
                ctx.fill();
                ctx.restore();
            });
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

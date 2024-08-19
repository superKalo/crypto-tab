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
                const cornerRadius = 0.5;

                // Determine whether to place the tooltip on the left or right
                const chartWidth = chart.width;
                let tooltipX;
                const tooltipY = tooltipPosition.y - tooltipHeight / 2;

                if (tooltipPosition.x > chartWidth / 2) {
                    // Position tooltip to the left + some padding
                    tooltipX = tooltipPosition.x - tooltipWidth - 22;

                    // Draw tooltip background and arrow as a single element
                    ctx.save();
                    ctx.fillStyle = 'rgba(79, 120, 226, 0.85)';
                    ctx.beginPath();

                    // Draw the rounded rectangle
                    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, cornerRadius);

                    // Draw the arrow pointing to the right
                    ctx.moveTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight / 2 - 11);
                    ctx.lineTo(tooltipX + tooltipWidth + 12, tooltipPosition.y);
                    ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight / 2 + 11);
                    ctx.closePath();
                    ctx.fill();
                } else {
                    // Position tooltip to the right + some padding
                    tooltipX = tooltipPosition.x + 22;

                    // Draw tooltip background and arrow as a single element
                    ctx.save();
                    ctx.fillStyle = 'rgba(79, 120, 226, 0.85)';
                    ctx.beginPath();

                    // Draw the rounded rectangle
                    ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, cornerRadius);

                    // Draw the arrow pointing to the left
                    ctx.moveTo(tooltipX, tooltipY + tooltipHeight / 2 - 11);
                    ctx.lineTo(tooltipX - 12, tooltipPosition.y);
                    ctx.lineTo(tooltipX, tooltipY + tooltipHeight / 2 + 11);
                    ctx.closePath();
                    ctx.fill();
                }

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

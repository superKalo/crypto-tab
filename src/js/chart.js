window.App = window.App || {};

/**
 * Yes, that's a Chart!
 *
 * {@link: https://github.com/chartjs/Chart.js}
 */
window.App.Chart = function (el) {
    this.el = el;
    this.cryptoType = App.CryptoTokens.getDefaultToken();
    this.period = App.CryptoTokens.getDefaultPeriod();
    this.labelColor = '#777';
    this.handleThemeChange = () => {
        this.updateTheme();
        this.chartInstance.update('theme');
    };
    this.handleClockFormatChange = () => {
        if (
            this.period === App.CryptoTokens.PERIODS.ONE_DAY ||
            this.period === App.CryptoTokens.PERIODS.ONE_HOUR
        ) {
            this.chartInstance.update('none');
        }
    };

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
        plugins: [
            {
                id: 'timeLabels',
                afterDatasetsDraw: (chart) => this.drawTimeLabels(chart),
            },
        ],
        options: {
            showAllTooltips: true,
            transitions: {
                // Refresh shared point styles without animating the theme change.
                theme: {
                    animation: { duration: 0 },
                },
            },
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
                        label: (tooltipItem) => this.formatTooltipLabel(tooltipItem),
                    },
                    displayColors: false,
                },
                legend: {
                    display: false,
                },
            },
            layout: {
                padding: () => {
                    const sidePadding =
                        parseFloat(getComputedStyle(this.el).getPropertyValue('--chart-side-padding')) ||
                        0;

                    return {
                        left: sidePadding,
                        right: sidePadding,
                        top: 20,
                        bottom: 0,
                    };
                },
            },
            responsive: true,
            maintainAspectRatio: false,
            hover: {
                mode: 'nearest',
                intersect: true,
            },
            scales: {
                x: {
                    display: true,
                    afterBuildTicks: (scale) => this.filterYearTicks(scale),
                    grid: {
                        display: false,
                    },
                    ticks: {
                        // Keep native label measurements while drawing time text in two tones.
                        color: () =>
                            this.usesCustomTimeLabels() ? 'transparent' : this.labelColor,
                        callback: (value) => this.formatTickLabel(this.config.data.labels[value]),
                    },
                },
                y: {
                    display: false,
                    grid: {
                        display: false,
                    },
                    ticks: {
                        callback: (value) => App.Utils.formatPrice(value, this.cryptoType),
                    },
                },
            },
        },
    };
};

window.App.Chart.prototype.isInitiated = function () {
    return !!this.chartInstance;
};

window.App.Chart.prototype.updateTheme = function () {
    const styles = getComputedStyle(document.documentElement);
    const color = (name) => styles.getPropertyValue(name).trim();
    const dataset = this.config.data.datasets[0];
    const tooltip = this.config.options.plugins.tooltip;

    dataset.borderColor = color('--chart-line-color');
    dataset.pointBorderColor = color('--chart-point-color');
    dataset.pointHoverBorderColor = dataset.pointBorderColor;
    dataset.backgroundColor = color('--background-color');
    dataset.pointBackgroundColor = dataset.backgroundColor;
    dataset.pointHoverBackgroundColor = dataset.backgroundColor;
    tooltip.backgroundColor = color('--tooltip-bg');
    tooltip.bodyColor = color('--tooltip-text-color');
    this.labelColor = color('--chart-label-color');
};

window.App.Chart.prototype.update = function (_labels, _data) {
    this.chartInstance.data.labels = _labels;
    this.chartInstance.data.datasets[0].data = _data;

    this.chartInstance.update();
};

window.App.Chart.prototype.formatTickLabel = function (label) {
    if (this.period === App.CryptoTokens.PERIODS.ALL) {
        return label.match(/\d{4}$/)?.[0] || label;
    }

    if (this.period === App.CryptoTokens.PERIODS.ONE_YEAR) {
        return label.replace(/ \d{2}(\d{2})$/, ' ’$1');
    }

    const isDay = this.period === App.CryptoTokens.PERIODS.ONE_DAY;
    if (!isDay && this.period !== App.CryptoTokens.PERIODS.ONE_HOUR) {
        return label;
    }

    const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(label);
    if (!time) {
        return label;
    }

    const hours = Number(time[1]);
    const is12Hour = App.Clock.format === '12h';
    const displayHour = String(is12Hour ? hours % 12 || 12 : hours).padStart(2, '0');
    const minutes = isDay && is12Hour && time[2] === '00' ? '' : `:${time[2]}`;
    const suffix = is12Hour ? (hours < 12 ? 'AM' : 'PM') : '';
    const separator = is12Hour ? ' ' : '';

    return `${displayHour}${minutes}${separator}${suffix}`;
};

window.App.Chart.prototype.formatTooltipLabel = function (tooltipItem) {
    const price = App.Utils.formatPrice(tooltipItem.parsed.y, this.cryptoType);
    if (this.period !== App.CryptoTokens.PERIODS.ALL) {
        return price;
    }

    const date = tooltipItem.label.replace(/ \d{2}(\d{2})$/, ' ’$1');
    return `${date} · ${price}`;
};

window.App.Chart.prototype.filterYearTicks = function (scale) {
    if (this.period !== App.CryptoTokens.PERIODS.ALL) {
        return;
    }

    const years = new Set();
    const yearlyTicks = scale.ticks.filter(({ value }) => {
        const year = this.formatTickLabel(this.config.data.labels[value]);
        if (years.has(year)) {
            return false;
        }

        years.add(year);
        return true;
    });
    // Anchor labels to January; a short initial year would crowd the next year's label.
    const yearStarts = yearlyTicks.filter(({ value }) =>
        /^Jan \d{4}$/.test(this.config.data.labels[value])
    );
    scale.ticks = yearStarts.length ? yearStarts : yearlyTicks;
};

window.App.Chart.prototype.usesCustomTimeLabels = function () {
    return (
        this.period === App.CryptoTokens.PERIODS.ONE_DAY ||
        this.period === App.CryptoTokens.PERIODS.ONE_MONTH ||
        this.period === App.CryptoTokens.PERIODS.ONE_YEAR ||
        (this.period === App.CryptoTokens.PERIODS.ONE_HOUR && App.Clock.format === '12h')
    );
};

window.App.Chart.prototype.drawTimeLabels = function (chart) {
    const scale = chart.scales.x;
    if (
        !this.usesCustomTimeLabels() ||
        !scale.options.display ||
        !scale.options.ticks.display
    ) {
        return;
    }

    const ctx = chart.ctx;
    const isDay = this.period === App.CryptoTokens.PERIODS.ONE_DAY;
    const isMonth = this.period === App.CryptoTokens.PERIODS.ONE_MONTH;
    const isYear = this.period === App.CryptoTokens.PERIODS.ONE_YEAR;
    let labelPattern = /^(\d{2})(:\d{2})?( AM| PM)?$/;
    if (isYear) {
        labelPattern = /^(.+)( ’\d{2})$/;
    } else if (isMonth) {
        labelPattern = /^(\d{1,2})( .+)$/;
    }
    scale.getLabelItems().forEach(({ label, font, textOffset, options }) => {
        const parts = labelPattern.exec(label)?.slice(1) || [label];

        ctx.save();
        ctx.font = font.string;
        ctx.fillStyle = this.labelColor;
        ctx.translate(...options.translation);
        ctx.rotate(options.rotation);
        ctx.textBaseline = options.textBaseline;
        ctx.textAlign = 'left';

        const width = ctx.measureText(label).width;
        const opacity = ctx.globalAlpha;
        let x = 0;
        if (options.textAlign === 'right' || options.textAlign === 'end') {
            x = -width;
        } else if (options.textAlign === 'center') {
            x = -width / 2;
        }

        parts.forEach((part, index) => {
            if (part) {
                const isMuted = index === 2 || ((isDay || isMonth || isYear) && index === 1);
                ctx.globalAlpha = opacity * (isMuted ? 0.5 : 1);
                ctx.fillText(part, x, textOffset);
                x += ctx.measureText(part).width;
            }
        });
        ctx.restore();
    });
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
            let foundMin = this.period === App.CryptoTokens.PERIODS.ALL && minValue === maxValue;
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
                const formattedValue = App.Utils.formatPrice(value, this.cryptoType);

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
                    ctx.fillStyle = chart.options.plugins.tooltip.backgroundColor;
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
                    ctx.fillStyle = chart.options.plugins.tooltip.backgroundColor;
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
                ctx.fillStyle = chart.options.plugins.tooltip.bodyColor;
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

window.App.Chart.prototype.init = function (
    _data,
    cryptoType = App.CryptoTokens.getDefaultToken(),
    period = App.CryptoTokens.getDefaultPeriod()
) {
    this.cryptoType = cryptoType;
    this.period = period;
    const isDay = period === App.CryptoTokens.PERIODS.ONE_DAY;
    this.config.options.scales.x.ticks.minRotation = isDay ? 45 : 0;
    this.config.options.scales.x.ticks.maxRotation = isDay ? 45 : 50;
    const { labels, values } = this.prepareData(_data);
    const isAll = period === App.CryptoTokens.PERIODS.ALL;
    const dataset = this.config.data.datasets[0];
    this.config.options.scales.x.ticks.autoSkipPadding = isAll ? 12 : 3;
    dataset.clip = isAll ? 8 : undefined;
    dataset.pointRadius = 5;
    if (isAll) {
        const minIndex = values.indexOf(Math.min(...values));
        const maxIndex = values.indexOf(Math.max(...values));
        dataset.pointRadius = values.map((_, index) =>
            index === minIndex || index === maxIndex ? 5 : 0
        );
    }
    this.config.options.hover.mode = isAll ? 'index' : 'nearest';
    this.config.options.hover.intersect = !isAll;

    // If already initiated - do not init twice! Update data only.
    if (this.isInitiated()) {
        this.update(labels, values);
        return;
    }

    this.alwaysVisibleTooltipsPlugin();

    this.config.data.labels = labels;
    this.config.data.datasets[0].data = values;
    this.updateTheme();

    const ctx = this.el.getContext('2d');
    this.chartInstance = new Chart(ctx, this.config);
    window.addEventListener('themechange', this.handleThemeChange);
    window.addEventListener('clockformatchange', this.handleClockFormatChange);
};

window.App.Chart.prototype.destroy = function () {
    if (!this.isInitiated()) {
        return;
    }

    this.chartInstance.destroy();
    this.chartInstance = null;
    window.removeEventListener('themechange', this.handleThemeChange);
    window.removeEventListener('clockformatchange', this.handleClockFormatChange);
};

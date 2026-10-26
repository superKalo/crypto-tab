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
    this.dateFormatters = new Map();
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
                        parseFloat(
                            getComputedStyle(this.el).getPropertyValue('--chart-side-padding')
                        ) || 0;

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
    return this.getTickLabelParts(label)
        .map(({ value }) => value)
        .join('');
};

window.App.Chart.prototype.getDateFormatter = function (options, locale = App.I18n.locale) {
    const key = `${locale}:${JSON.stringify(options)}`;
    if (!this.dateFormatters.has(key)) {
        this.dateFormatters.set(key, new Intl.DateTimeFormat(locale, options));
    }

    return this.dateFormatters.get(key);
};

window.App.Chart.prototype.getTickLabelParts = function (label) {
    if (this.period === App.CryptoTokens.PERIODS.ALL) {
        return [{ value: label.match(/\d{4}$/)?.[0] || label }];
    }

    if (this.period === App.CryptoTokens.PERIODS.ONE_YEAR) {
        return this.getCalendarLabelParts(label, true);
    }

    const isDay = this.period === App.CryptoTokens.PERIODS.ONE_DAY;
    if (!isDay && this.period !== App.CryptoTokens.PERIODS.ONE_HOUR) {
        return this.getCalendarLabelParts(label);
    }

    const time = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(label);
    if (!time) {
        return [{ value: label }];
    }

    const hours = Number(time[1]);
    const is12Hour = App.Clock.format === '12h';
    const omitMinutes = isDay && is12Hour && time[2] === '00';
    const options = {
        hour: '2-digit',
        hourCycle: is12Hour ? 'h12' : 'h23',
        timeZone: 'UTC',
    };
    if (!omitMinutes) {
        options.minute = '2-digit';
    }

    // Keep 12-hour labels consistent, including AM/PM, separators, and their placement.
    return this.getDateFormatter(options, is12Hour ? 'en-US' : App.I18n.locale)
        .formatToParts(Date.UTC(2024, 0, 1, hours, Number(time[2])))
        .map(({ type, value }) => ({
            value,
            muted: type === 'dayPeriod' || (isDay && (type === 'minute' || type === 'literal')),
        }));
};

window.App.Chart.prototype.getCalendarLabelParts = function (label, shortYear = false) {
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
    ];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthYear = /^([A-Z][a-z]{2}) (\d{4})$/.exec(label);
    const monthDay = /^(\d{1,2}) ([A-Z][a-z]{2})$/.exec(label);
    const weekday = weekdays.indexOf(label);
    let timestamp;
    let options;
    let mutedType;

    if (monthYear && months.includes(monthYear[1])) {
        const month = months.indexOf(monthYear[1]);
        timestamp = Date.UTC(Number(monthYear[2]), month, 1);
        options = { month: 'short', year: shortYear ? '2-digit' : 'numeric' };
        mutedType = 'year';
        if (App.I18n.locale === 'en' && shortYear) {
            return [{ value: monthYear[1] }, { value: ` ’${monthYear[2].slice(-2)}`, muted: true }];
        }
    } else if (monthDay && months.includes(monthDay[2])) {
        timestamp = Date.UTC(2024, months.indexOf(monthDay[2]), Number(monthDay[1]));
        options = { month: 'short', day: 'numeric' };
        mutedType = 'month';
        if (App.I18n.locale === 'en') {
            return [{ value: monthDay[1] }, { value: ` ${monthDay[2]}`, muted: true }];
        }
    } else if (weekday !== -1) {
        timestamp = Date.UTC(2024, 0, 7 + weekday);
        options = { weekday: 'long' };
    } else {
        return [{ value: label }];
    }

    // Repository labels stay canonical: localization never changes persisted cache data.
    return this.getDateFormatter({ ...options, timeZone: 'UTC' })
        .formatToParts(timestamp)
        .map(({ type, value }) => ({ value, muted: type === mutedType || type === 'literal' }));
};

window.App.Chart.prototype.formatTooltipLabel = function (tooltipItem) {
    const price = App.Utils.formatPrice(tooltipItem.parsed.y, this.cryptoType);
    if (this.period !== App.CryptoTokens.PERIODS.ALL) {
        return price;
    }

    const date = this.getCalendarLabelParts(tooltipItem.label, true)
        .map(({ value }) => value)
        .join('');
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
    if (!this.usesCustomTimeLabels() || !scale.options.display || !scale.options.ticks.display) {
        return;
    }

    const ctx = chart.ctx;
    scale.getLabelItems().forEach(({ label, font, textOffset, options }, index) => {
        const canonicalLabel = this.config.data.labels[scale.ticks[index].value];
        const parts = this.getTickLabelParts(canonicalLabel);

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

        parts.forEach(({ value, muted }) => {
            if (value) {
                ctx.globalAlpha = opacity * (muted ? 0.5 : 1);
                ctx.fillText(value, x, textOffset);
                x += ctx.measureText(value).width;
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
            const averageLabel = {
                ONE_WEEK: App.I18n.t('chart.dailyAverage'),
                ONE_MONTH: App.I18n.t('chart.dailyAverage'),
                ONE_YEAR: App.I18n.t('chart.monthlyAverage'),
                ALL: App.I18n.t('chart.monthlyAverage'),
            }[this.period];

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

                ctx.save();
                ctx.textBaseline = 'alphabetic';

                // Keep a little more room on the flat side than beside the wedge.
                const caretSidePadding = 4;
                const flatSidePadding = 6;
                ctx.font = '12px Arial';
                const priceMetrics = ctx.measureText(formattedValue);
                let textWidth = priceMetrics.width;
                let averageMetrics;
                if (averageLabel) {
                    ctx.font = '11px Arial';
                    averageMetrics = ctx.measureText(averageLabel);
                    textWidth = Math.max(textWidth, averageMetrics.width);
                }
                const tooltipWidth = Math.ceil(textWidth) + caretSidePadding + flatSidePadding;
                const tooltipHeight = averageLabel ? 36 : 22;
                const cornerRadius = 3;
                const caretJoinRadius = 4;
                const caretWidth = averageLabel ? 14 : 11;
                const pointGap = 9;
                const isLeft = tooltipPosition.x > chart.width / 2;
                const tooltipX = isLeft
                    ? tooltipPosition.x - pointGap - caretWidth - tooltipWidth
                    : tooltipPosition.x + pointGap + caretWidth;
                const tooltipY = Math.max(
                    2,
                    Math.min(
                        tooltipPosition.y - tooltipHeight / 2,
                        chart.height - tooltipHeight - 2
                    )
                );
                const right = tooltipX + tooltipWidth;
                const bottom = tooltipY + tooltipHeight;
                const textX =
                    tooltipX +
                    (isLeft ? flatSidePadding : caretSidePadding) +
                    Math.ceil(textWidth) / 2;

                // The full-height wedge keeps the original price-tag silhouette.
                ctx.fillStyle = chart.options.plugins.tooltip.backgroundColor;
                ctx.beginPath();
                ctx.moveTo(tooltipX + cornerRadius, tooltipY);
                if (isLeft) {
                    ctx.arcTo(
                        right,
                        tooltipY,
                        right + caretWidth,
                        tooltipPosition.y,
                        caretJoinRadius
                    );
                    ctx.lineTo(right + caretWidth, tooltipPosition.y);
                    ctx.arcTo(right, bottom, tooltipX, bottom, caretJoinRadius);
                } else {
                    ctx.lineTo(right - cornerRadius, tooltipY);
                    ctx.quadraticCurveTo(right, tooltipY, right, tooltipY + cornerRadius);
                    ctx.lineTo(right, bottom - cornerRadius);
                    ctx.quadraticCurveTo(right, bottom, right - cornerRadius, bottom);
                }
                if (isLeft) {
                    ctx.lineTo(tooltipX + cornerRadius, bottom);
                    ctx.quadraticCurveTo(tooltipX, bottom, tooltipX, bottom - cornerRadius);
                    ctx.lineTo(tooltipX, tooltipY + cornerRadius);
                    ctx.quadraticCurveTo(tooltipX, tooltipY, tooltipX + cornerRadius, tooltipY);
                } else {
                    ctx.arcTo(
                        tooltipX,
                        bottom,
                        tooltipX - caretWidth,
                        tooltipPosition.y,
                        caretJoinRadius
                    );
                    ctx.lineTo(tooltipX - caretWidth, tooltipPosition.y);
                    ctx.arcTo(tooltipX, tooltipY, right, tooltipY, caretJoinRadius);
                }
                ctx.closePath();
                ctx.fill();

                // Center the visible glyphs, rather than the font's em box.
                const priceHeight =
                    priceMetrics.actualBoundingBoxAscent + priceMetrics.actualBoundingBoxDescent;
                const averageHeight = averageMetrics
                    ? averageMetrics.actualBoundingBoxAscent +
                      averageMetrics.actualBoundingBoxDescent
                    : 0;
                const textHeight = priceHeight + (averageLabel ? 4 + averageHeight : 0);
                const textTop = tooltipY + (tooltipHeight - textHeight) / 2;
                ctx.fillStyle = chart.options.plugins.tooltip.bodyColor;
                ctx.textAlign = 'center';
                ctx.font = '12px Arial';
                ctx.fillText(formattedValue, textX, textTop + priceMetrics.actualBoundingBoxAscent);
                if (averageLabel) {
                    ctx.font = '11px Arial';
                    ctx.globalAlpha *= 0.7;
                    ctx.fillText(
                        averageLabel,
                        textX,
                        textTop + priceHeight + 4 + averageMetrics.actualBoundingBoxAscent
                    );
                }

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

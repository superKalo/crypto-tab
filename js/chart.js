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
                pointBorderWidth: 3,
                pointRadius: 5,
                data: [],
                borderWidth: 2,
                fill: false,
                // Bezier curve tension of the line
                lineTension: 0
            }]
        },
        options: {
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 10,
                    bottom: 0
                }
            },
            responsive: true,
            tooltips: {
                mode: 'index',
                intersect: false,
                backgroundColor: '#B0C4F6',
                titleFontStyle: 'normal',
                titleFontColor: '#000',
                bodyFontColor: '#4F78E2',
                bodyFontStyle: 'bold',
                borderColor: '#4F78E2',
                borderWidth: 2,
                cornerRadius: 3,
                caretPadding: 5,
                displayColors: false
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

window.App.Chart.prototype.init = function(_labels, _data) {
    // If already initiated - do not init twice! Update data only.
    if (this.isInitiated()) {
        this.update(_labels, _data);

        return;
    }

    this.config.data.labels = _labels;
    this.config.data.datasets[0].data = _data;

    var ctx = this.el.getContext('2d');
    this.chartInstance = new Chart(ctx, this.config);
}

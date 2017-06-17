window.AppChart = function(el) {
    this.el = el;

    this.config = {
        type: 'line',

        data: {
            labels: [],
            datasets: [{
                backgroundColor: '#fff',
                borderColor: '#B0C4F6',
                pointBorderColor: '#4F78E2',
                pointHoverBackgroundColor: '#4F78E2',
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
                        callback: (value) => `$${value}`
                    }
                }]
            }
        }
    };
}

AppChart.prototype.isInitiated = function() {
    return !! this.chartInstance;
}

AppChart.prototype.update = function(_labels, _data) {
    this.chartInstance.data.labels = _labels;
    this.chartInstance.data.datasets[0].data = _data;

    this.chartInstance.update();
}

AppChart.prototype.init = function(_labels, _data) {
    this.config.data.labels = _labels;
    this.config.data.datasets[0].data = _data;

    var ctx = this.el.getContext('2d');
    this.chartInstance = new Chart(ctx, this.config);
}

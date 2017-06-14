window.AppChart = function(el) {
    this.el = el;

    this.config = {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                backgroundColor: '#666',
                borderColor: '#000',
                data: [],
                fill: false
            }]
        },
        options: {
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
                    display: true
                }],
                yAxes: [{
                    display: true,
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

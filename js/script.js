var config = {
    type: 'line',
    data: {
        labels: [
            '2012-03-23',
            '2010-10-14',
            '2012-05-18',
            '2013-12-06',
            '2010-06-21',
            '2010-05-12',
            '2013-01-22',
            '2012-11-19',
            '2014-02-12',
            '2016-09-11',
            '2017-10-01',
            '2015-11-11',
            '2017-08-21',
            '2010-06-23',
            '2013-06-23',
            '2016-01-05'
        ],
        datasets: [{
            backgroundColor: '#666',
            borderColor: '#000',
            data: [
                76,
                50,
                66,
                10,
                76,
                33,
                97,
                49,
                20,
                73,
                31,
                34,
                40,
                30,
                12,
                64
            ],
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
                display: true,
                scaleLabel: {
                    display: true,
                    labelString: 'Month'
                }
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

window.onload = function() {
    var ctx = document.getElementById('chart').getContext('2d');
    window.myLine = new Chart(ctx, config);
};

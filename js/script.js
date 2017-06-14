$(function(){

    const labels = [
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
    ];

    const data = [
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
    ];

    const el = document.getElementById('chart');

    const mainChart = new AppChart();
    mainChart.init(el, labels, data);

    $('#monthly').on('click', function(){
        // duration is the time for the animation of the redraw in milliseconds
        // lazy is a boolean. if true, the animation can be interrupted by other animations
        //mainChart.update(
        //     ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        //     [1,31,18,32,26,81,54,41,75,80,49,40]
        // );
    });

});

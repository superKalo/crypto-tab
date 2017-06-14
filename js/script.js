$(function(){
    const el = document.getElementById('chart');
    const mainChart = new AppChart(el);

    $dataPeriods = $('.js-period');

    $dataPeriods.on('click', function() {
        $('#periods').find('.active').removeClass('active');
        $(this).addClass('active');
    });

    $dataPeriods.on('click', function(){
        const period = $(this).data('period');
        let data;

        switch(period) {
            case 'ALL':
                data = Api.getBitcoinRatesForAll();
                break;
            case 'ONE_YEAR':
                data = Api.getBitcoinRatesForOneYear();
                break;
            case 'ONE_MONTH':
                data = Api.getBitcoinRatesForOneMonth();
                break;
            case 'ONE_WEEK':
                data = Api.getBitcoinRatesForOneWeek();
                break;
            case 'ONE_DAY':
                data = Api.getBitcoinRatesForOneDay();
                break;
            case 'ONE_HOUR':
                data = Api.getBitcoinRatesForOneHour()
        }

        if (mainChart.isInitiated()) {
            mainChart.update(data.labels, data.values);
        } else {
            mainChart.init(data.labels, data.values);
        }
    });

    $dataPeriods.eq(3).trigger('click');

});

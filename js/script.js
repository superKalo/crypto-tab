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

        // switch(period) {
        //     case 'ALL':
        //         data = App.API.getBitcoinRatesForAll();
        //         break;
        //     case 'ONE_YEAR':
        //         data = App.API.getBitcoinRatesForOneYear();
        //         break;
        //     case 'ONE_MONTH':
        //         data = App.API.getBitcoinRatesForOneMonth();
        //         break;
        //     case 'ONE_WEEK':
        //         data = App.API.getBitcoinRatesForOneWeek();
        //         break;
        //     case 'ONE_DAY':
        //         data = App.API.getBitcoinRatesForOneDay();
        //         break;
        //     case 'ONE_HOUR':
                
        // }
        //
        
        App.API.getBitcoinRatesForOneHour().done( response => {
            debugger;
            data = response;


            if (mainChart.isInitiated()) {
                mainChart.update(data.labels, data.values);
            } else {
                mainChart.init(data.labels, data.values);
            }
        })
    });

    $dataPeriods.eq(1).trigger('click');

});

$(function(){
    const el = document.getElementById('chart');
    const mainChart = new AppChart(el);

    $dataPeriods = $('.js-period');

    $dataPeriods.on('click', function() {
        $('#periods').find('.active').removeClass('active');
        $(this).addClass('active');
    });

    function triggerChart(_response) {
        let { data } = _response;
        let labels = [];
        let values = [];

        data.forEach( dataPoint => {
            labels.push(dataPoint.timestamp.toString());
            values.push(dataPoint.value);
        });

        if (mainChart.isInitiated()) {
            mainChart.update(labels, values);
        } else {
            mainChart.init(labels, values);
        }
    }

    $dataPeriods.on('click', function(){
        const period = $(this).data('period');

        switch(period) {
            case 'ALL':
                App.API.getBitcoinRatesForAll()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
            case 'ONE_YEAR':
                App.API.getBitcoinRatesForOneYear()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
            case 'ONE_MONTH':
                App.API.getBitcoinRatesForOneMonth()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
            case 'ONE_WEEK':
                App.API.getBitcoinRatesForOneWeek()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
            case 'ONE_DAY':
                App.API.getBitcoinRatesForOneDay()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
            case 'ONE_HOUR':
                App.API.getBitcoinRatesForOneHour()
                    .done( response => triggerChart(response))
                    .fail( (jqXHR, textStatus, errorThrown) =>
                        console.log(jqXHR, textStatus, errorThrown));
                break;
        }
    });

    $dataPeriods.eq(1).trigger('click');

});

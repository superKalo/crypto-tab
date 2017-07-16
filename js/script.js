$(function(){
    // Init Chart
    const el = document.getElementById('chart');
    const chart = new App.Chart(el);

    // Init Clock
    const clock = new App.Clock();

    $dataPeriods = $('.js-period');

    $dataPeriods.on('click', function() {
        $('#periods').find('.active').removeClass('active');
        $(this).addClass('active');
    });

    function normalizeData(_response, _dateFormat) {
        let { data } = _response;
        let labels = [];
        let values = [];

        data.forEach( dataPoint => {
            labels.push(moment(dataPoint.timestamp).format(_dateFormat));
            values.push(dataPoint.value);
        });

        return {
            values,
            labels
        };
    }

    function getBitcoinData(period) {
        switch(period) {
            case 'ALL':
                return App.API.getBitcoinRatesForAll();
            case 'ONE_YEAR':
                return App.API.getBitcoinRatesForOneYear();
            case 'ONE_MONTH':
                return App.API.getBitcoinRatesForOneMonth();
            case 'ONE_WEEK':
                return App.API.getBitcoinRatesForOneWeek();
            case 'ONE_DAY':
                return App.API.getBitcoinRatesForOneDay();
            case 'ONE_HOUR':
                return App.API.getBitcoinRatesForOneHour();
        }
    }

    function getLabelFormat(period) {
        switch(period) {
            case 'ALL': return 'MMM YYYY';
            case 'ONE_YEAR': return 'MMM YYYY';
            case 'ONE_MONTH': return 'do MMM';
            case 'ONE_WEEK': return 'dddd';
            case 'ONE_DAY': return 'HH:mm';
            case 'ONE_HOUR': return 'HH:mm';
        }
    }

    $dataPeriods.on('click', function(){
        const period = $(this).data('period');
        const dateFormat = getLabelFormat(period);

        getBitcoinData(period)
            .done( response => {
                const data = normalizeData(response, dateFormat);

                chart.init(data.labels, data.values);
            })
            .fail( (jqXHR, textStatus, errorThrown) =>
                console.log(jqXHR, textStatus, errorThrown));
    });

    $dataPeriods.eq(1).trigger('click');

});

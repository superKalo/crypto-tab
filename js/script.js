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

    let BitcoinRepository;

    $dataPeriods.on('click', function(){
        const period = $(this).data('period');
        const dateFormat = getLabelFormat(period);

        BitcoinRepository = new SuperRepo({
            storage: 'BROWSER_STORAGE',
            name: 'bitcoin',
            outOfDateAfter: 15 * 1000,
            mapData: r => r.data.map( _rec => ({
                value: _rec.value,
                timestamp: moment(_rec.timestamp).format(dateFormat)
            })),
            request: () => getBitcoinData(period)
        });

        BitcoinRepository.clearData().then( () => {
            BitcoinRepository.getData()
                .then(_data => chart.init(_data));
        });
    });

    $dataPeriods.eq(1).trigger('click');

});

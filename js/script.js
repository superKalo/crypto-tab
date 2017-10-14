const PERIODS = {
    ALL: 'ALL',
    ONE_YEAR: 'ONE_YEAR',
    ONE_MONTH: 'ONE_MONTH',
    ONE_WEEK: 'ONE_WEEK',
    ONE_DAY: 'ONE_DAY',
    ONE_HOUR: 'ONE_HOUR'
};

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
            case 'ALL': return 'YYYY';
            case 'ONE_YEAR': return 'MMM YYYY';
            case 'ONE_MONTH': return 'Do MMM';
            case 'ONE_WEEK': return 'dddd';
            case 'ONE_DAY': return 'HH:mm';
            case 'ONE_HOUR': return 'HH:mm';
        }
    }

    const BitcoinRepository = {};
    Object.keys(PERIODS).forEach( period =>
        BitcoinRepository[period] = new SuperRepo({
            storage: 'BROWSER_STORAGE',
            name: 'bitcoin-' + period,
            outOfDateAfter: 15 * 60 * 1000,
            mapData: r => App.API.mapData(r, getLabelFormat(period)),
            request: () => getBitcoinData(period)
        })
    );

    $dataPeriods.on('click', function(){
        const period = $(this).data('period');

        BitcoinRepository[period].getData()
            .then(_data => chart.init(_data));
    });

    $dataPeriods.eq(1).trigger('click');

    // Now
    BitcoinRepository['NOW'] = new SuperRepo({
        storage: 'BROWSER_STORAGE',
        name: 'bitcoin-now',
        outOfDateAfter: 3 * 60 * 1000,
        dataModel: [{
            value: 'value'
        }],
        mapData: data => ({ price: data[0].value }),
        request: () => App.API.getBitcoinRatesNow()
    });

    BitcoinRepository['NOW'].getData().then( _data => {
        let priceNow = _data.price;

        /**
         * Beautify the price.
         * https://stackoverflow.com/a/14467460/1333836
         */
        priceNow = Math.round(priceNow).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        document.querySelector('#price-now').textContent = `$${priceNow}`;

        BitcoinRepository['NOW'].getDataUpToDateStatus().then(info => {
            lastUpdated.textContent = moment(info.lastFetched).fromNow();
        });
    });

    const lastUpdated = document.querySelector('#last-updated');

    BitcoinRepository['NOW'].getDataUpToDateStatus().then(info => {
        lastUpdated.textContent = moment(info.lastFetched).fromNow();
    });
    setInterval( () => {
        BitcoinRepository['NOW'].getDataUpToDateStatus().then(info => {
            lastUpdated.textContent = moment(info.lastFetched).fromNow();
        });
    }, 30 * 1000);

});

const PERIODS = {
    ALL: 'ALL',
    ONE_YEAR: 'ONE_YEAR',
    ONE_MONTH: 'ONE_MONTH',
    ONE_WEEK: 'ONE_WEEK',
    ONE_DAY: 'ONE_DAY',
    ONE_HOUR: 'ONE_HOUR'
};

$(function(){
    // Init Clock
    const clock = new App.Clock();

    // Now
    const BitcoinRepository = {}
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

    const lastUpdated = document.querySelector('#last-updated');

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

    BitcoinRepository['NOW'].getDataUpToDateStatus().then(info => {
        lastUpdated.textContent = moment(info.lastFetched).fromNow();
    });
    setInterval( () => {
        BitcoinRepository['NOW'].getDataUpToDateStatus().then(info => {
            lastUpdated.textContent = moment(info.lastFetched).fromNow();
        });
    }, 30 * 1000);

});

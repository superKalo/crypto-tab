window.App = window.App || {};

window.App.Bitcoin = {
    PERIODS: {
        ALL: 'ALL',
        ONE_YEAR: 'ONE_YEAR',
        ONE_MONTH: 'ONE_MONTH',
        ONE_WEEK: 'ONE_WEEK',
        ONE_DAY: 'ONE_DAY',
        ONE_HOUR: 'ONE_HOUR'
    },

    $chart: document.getElementById('chart'),
    chart: null,

    $dataPeriods: document.querySelectorAll('.js-period'),
    initEvents() {
        const self = this;

        [...self.$dataPeriods].forEach(el => {
            el.addEventListener('click', function() {
                self.$dataPeriods.forEach(p => p.classList.remove('active'));
                this.classList.add('active');

                const period = this.dataset.period;
                self.repositories[period].getData()
                    .then(_data => self.chart.init(_data));
            });
        })

        self.$dataPeriods[0].click();
    },

    getBitcoinData(period) {
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
    },

    getLabelFormat(period) {
        switch(period) {
            case 'ALL': return 'YYYY';
            case 'ONE_YEAR': return 'MMM YYYY';
            case 'ONE_MONTH': return 'Do MMM';
            case 'ONE_WEEK': return 'dddd';
            case 'ONE_DAY': return 'HH:mm';
            case 'ONE_HOUR': return 'HH:mm';
        }
    },

    repositories: {},
    initRepositories() {
        Object.keys(this.PERIODS).forEach( period =>
            this.repositories[period] = new SuperRepo({
                storage: 'BROWSER_STORAGE',
                name: 'bitcoin-' + period,
                outOfDateAfter: 15 * 60 * 1000,
                mapData: r => App.API.mapData(r, this.getLabelFormat(period)),
                request: () => this.getBitcoinData(period)
            })
        );

        this.repositories['NOW'] = new SuperRepo({
            storage: 'BROWSER_STORAGE',
            name: 'bitcoin-NOW',
            outOfDateAfter: 3 * 60 * 1000,
            dataModel: [{
                value: 'value'
            }],
            mapData: data => ({ price: data[0].value }),
            request: () => App.API.getBitcoinRatesNow()
        });
    },

    $priceNow: document.querySelector('#price-now'),
    setPriceNow(_price) {
        /**
         * Beautify the price.
         * https://stackoverflow.com/a/14467460/1333836
         */
        const price = Math.round(_price).toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        this.$priceNow.textContent = `$${price}`;
    },

    $lastUpdated: document.querySelector('#last-updated'),
    setLastUpdated() {
        this.repositories['NOW'].getDataUpToDateStatus().then(info => {
            this.$lastUpdated.textContent = moment(info.lastFetched).fromNow();
        });
    },

    displayPriceNow() {
        this.repositories['NOW'].getData().then( _data => {
            this.setPriceNow(_data.price);
            this.setLastUpdated();
        });

        setInterval(this.setLastUpdated.bind(this), 30 * 1000);
    },

    init() {
        this.chart = new App.Chart(this.$chart);

        this.initRepositories();
        this.displayPriceNow();

        this.initEvents();
    }
};

window.App.Bitcoin.init();

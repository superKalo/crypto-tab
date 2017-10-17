window.App = window.App || {};

window.App.Bitcoin = {
    PERIODS: {
        ONE_HOUR: 'ONE_HOUR',
        ONE_DAY: 'ONE_DAY',
        ONE_WEEK: 'ONE_WEEK',
        ONE_MONTH: 'ONE_MONTH',
        ONE_YEAR: 'ONE_YEAR',
        ALL: 'ALL',
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

                App.Settings.set('period', this.dataset.period);
            });
        });

        App.Settings.get().then( ({ period }) => {
            const selectedTab =
                period ? Object.keys(this.PERIODS).indexOf(period) : 1;

            self.$dataPeriods[selectedTab].click();
        });
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
        const storageSetting =
            App.ENV.platform === 'EXTENSION' ? 'BROWSER_STORAGE' : 'LOCAL_STORAGE';

        Object.keys(this.PERIODS).forEach( period =>
            this.repositories[period] = new SuperRepo({
                storage: storageSetting,
                name: 'bitcoin-' + period,
                outOfDateAfter: 15 * 60 * 1000,
                mapData: r => App.API.mapData(r, this.getLabelFormat(period)),
                request: () => this.getBitcoinData(period)
            })
        );

        this.repositories['NOW'] = new SuperRepo({
            storage: storageSetting,
            name: 'bitcoin-NOW',
            outOfDateAfter: 3 * 60 * 1000,
            mapData: data => {
                const { value, changePercent } = data[0];
                const { dayAgo, weekAgo, monthAgo } = changePercent;

                return {
                    price: value,
                    changePercent: { dayAgo, weekAgo, monthAgo }
                };
            },
            request: () => App.API.getBitcoinRatesNow()
        });
    },

    $priceNow: document.querySelector('#price-now'),
    setPriceNow(_price) {
        this.$priceNow.textContent = App.Utils.formatPrice(Math.round(_price));
    },

    $change: document.querySelector('#change'),
    setPriceChange(_change) {
        App.Settings.get().then(settings => {
            let changePercent;
            let periodLabel;
            switch(settings.period) {
                case this.PERIODS.ONE_HOUR:
                case this.PERIODS.ONE_DAY:
                default: {
                    changePercent = _change.dayAgo;
                    periodLabel = 'since yesterday';
                    break;
                }
                case this.PERIODS.ONE_WEEK: {
                    changePercent = _change.weekAgo;
                    periodLabel = 'since last week';
                    break;
                }
                case this.PERIODS.ONE_MONTH: {
                    changePercent = _change.monthAgo;
                    periodLabel = 'since last month';
                    break;
                }
                case this.PERIODS.ONE_YEAR:
                case this.PERIODS.ALL: {
                    this.$change.innerHTML = '';
                    return;
                }
            }

            const isChangePisitive = changePercent >= 0;
            const isChangeZero = changePercent === 0;
            const applyVisualClass =
                isChangeZero ? '' : (isChangePisitive ? 'positive' : 'negative');
            this.$change.innerHTML =
                ` (<span class="${applyVisualClass}">${isChangePisitive && ! isChangeZero? '+' : ''}${changePercent}%</span>
                ${periodLabel})`;
        });
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
            this.setPriceChange(_data.changePercent);
            this.setLastUpdated();
        });

        // Track timeframe changes
        setInterval(this.setLastUpdated.bind(this), 30 * 1000);

        // Track period changes
        if (App.ENV.platform === 'EXTENSION') {
            browser.storage.onChanged.addListener((changes, namespace) => {
                Object.keys(changes).forEach( storageKey => {
                    if (storageKey !== 'settings') {
                        return;
                    }

                    this.repositories['NOW'].getDataUpToDateStatus()
                        .then( status =>
                            status.localData &&
                                this.setPriceChange(status.localData.changePercent)
                        );
                });
            });
        }
    },

    init() {
        this.chart = new App.Chart(this.$chart);

        this.initRepositories();
        this.displayPriceNow();

        this.initEvents();
    }
};

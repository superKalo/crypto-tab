dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_localizedFormat);
dayjs.extend(window.dayjs_plugin_relativeTime);
dayjs.extend(window.dayjs_plugin_calendar);

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
    isLocalChartDataOld: false,
    isLocalNowDataOld: false,

    $chart: document.getElementById('chart'),
    chart: null,

    $dataPeriods: document.querySelectorAll('.js-period'),
    initEvents() {
        const self = this;

        [...self.$dataPeriods].forEach((el) => {
            el.addEventListener('click', function () {
                self.$dataPeriods.forEach((p) => p.classList.remove('active'));
                this.classList.add('active');

                const period = this.dataset.period;
                self.getBitcoinDataFromBackground(period)
                    .then((_data) => {
                        self.chart.init(_data);
                    })
                    .catch((error) => {
                        self.handleChartRejection(period, error);
                    });

                App.Settings.set('period', this.dataset.period);

                self.setPriceChange();
            });
        });

        App.Settings.get().then(({ period }) => {
            const selectedTab = period ? Object.keys(this.PERIODS).indexOf(period) : 1;
            self.$dataPeriods[selectedTab].click();
        });
    },

    getBitcoinData(period) {
        return new Promise((resolve, reject) => {
            this.repositories[period]
                .getData()
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error || 'Failed to retrieve Bitcoin price data');
                });
        });
    },

    handleChartRejection(_period, _error) {
        this.isLocalChartDataOld = true;

        // TODO: Temporarily
        App.Loader.destroy();
        // TODO: Adjust
        this.repositories[_period].getDataUpToDateStatus().then((_res) => {
            App.Loader.destroy();

            if (_res.localData === null) {
                App.Message.fireError("That's extremely sad. " + _error);
                this.chart.destroy();
            } else if (_res.localData.length) {
                App.Message.clear();
                this.chart.init(_res.localData);
                this.setLastUpdated(true);
            }
        });
    },
    handleNowRejection() {
        this.isLocalNowDataOld = true;
        App.Loader.destroy();
    },

    repositories: {},
    initRepositories() {
        const storageSetting =
            App.ENV.platform === 'EXTENSION' ? 'BROWSER_STORAGE' : 'LOCAL_STORAGE';

        // Object.keys(this.PERIODS).forEach((period) => {
        //     this.repositories[period] = new SuperRepo({
        //         storage: storageSetting,
        //         name: 'bitcoin-' + period,
        //         outOfDateAfter: 15 * 60 * 1000, // 15 minutes
        //         mapData: (r) => App.API.mapData(r, this.getLabelFormat(period)),
        //         request: () =>
        //             this.getBitcoinDataFromBackground(period)
        //                 .then((res) => {
        //                     this.isLocalChartDataOld = false;
        //                     return res;
        //                 })
        //                 .catch((jqXHR, textStatus, errorThrown) => {
        //                     this.handleChartRejection(period, jqXHR);
        //                 }),
        //     });
        // });

        this.repositories['NOW'] = new SuperRepo({
            storage: storageSetting,
            name: 'bitcoin-NOW',
            outOfDateAfter: 3 * 60 * 1000, // 3 minutes
            mapData: (data) => {
                const { value, changePercent } = data[0];
                const { dayAgo, weekAgo, monthAgo } = changePercent;

                return {
                    price: value,
                    changePercent: { dayAgo, weekAgo, monthAgo },
                };
            },
            request: () =>
                this.getBitcoinDataFromBackground('NOW')
                    .then((res) => {
                        this.isLocalNowDataOld = false;
                        return res;
                    })
                    .catch(() => {
                        this.handleNowRejection();
                    }),
        });
    },

    getBitcoinDataFromBackground(period) {
        return new Promise((resolve, reject) => {
            window.browser.runtime.sendMessage(
                { type: 'getBitcoinPrice', period: period },
                (response) => {
                    if (response && !response.error) {
                        resolve(response.data);
                    } else {
                        reject(response.error || 'Failed to retrieve Bitcoin price data');
                    }
                }
            );
        });
    },

    $priceNow: document.querySelector('#price-now'),
    setPriceNow(_price) {
        this.$priceNow.textContent = App.Utils.formatPrice(Math.round(_price));
    },

    $change: document.querySelector('#change'),
    async setPriceChange() {
        let { localData } = await this.repositories['NOW'].getDataUpToDateStatus();
        if (!localData) {
            return;
        }

        this.setPriceNow(localData.price);

        const { dayAgo, weekAgo, monthAgo } = localData.changePercent;
        let settings = await App.Settings.get();

        let changePercent;
        let periodLabel;
        switch (settings.period) {
            case this.PERIODS.ONE_DAY:
            default: {
                changePercent = dayAgo;
                periodLabel = 'since yesterday';
                break;
            }
            case this.PERIODS.ONE_WEEK: {
                changePercent = weekAgo;
                periodLabel = 'since last week';
                break;
            }
            case this.PERIODS.ONE_MONTH: {
                changePercent = monthAgo;
                periodLabel = 'since last month';
                break;
            }
            case this.PERIODS.ONE_HOUR:
            case this.PERIODS.ONE_YEAR:
            case this.PERIODS.ALL: {
                this.$change.textContent = '';
                return;
            }
        }

        const getSignedPercentage = (_number) => {
            const isChangePositive = _number >= 0;
            const isChangeZero = _number === 0;

            return isChangePositive && !isChangeZero ? `+${_number}%` : `${_number}%`;
        };
        const getVisualClass = (_number) => {
            const isChangePositive = _number >= 0;
            const isChangeZero = _number === 0;

            return isChangeZero ? '' : isChangePositive ? 'positive' : 'negative';
        };

        // Clear existing content
        this.$change.textContent = '';

        // Create and append new content safely
        const changeElement = document.createElement('span');
        changeElement.className = getVisualClass(changePercent);
        changeElement.textContent = getSignedPercentage(changePercent);

        this.$change.appendChild(document.createTextNode(' ('));
        this.$change.appendChild(changeElement);
        this.$change.appendChild(document.createTextNode(` ${periodLabel})`));
    },

    $lastUpdated: document.querySelector('#last-updated'),
    setLastUpdated() {
        this.repositories['NOW'].getDataUpToDateStatus().then((info) => {
            const prettyLastUpdatedTime = dayjs(info.lastFetched).fromNow();

            // Clear existing content
            this.$lastUpdated.textContent = '';

            const lastUpdatedSpan = document.createElement('span');
            lastUpdatedSpan.className =
                this.isLocalChartDataOld || this.isLocalNowDataOld ? 'negative' : 'positive';
            lastUpdatedSpan.textContent = prettyLastUpdatedTime;

            const failureMessage =
                this.isLocalChartDataOld || this.isLocalNowDataOld
                    ? '. Data request failed. Refresh the page to try again.'
                    : '.';

            this.$lastUpdated.appendChild(lastUpdatedSpan);
            this.$lastUpdated.appendChild(document.createTextNode(failureMessage));

            this.$lastUpdated.setAttribute('data-tooltip', dayjs(info.lastFetched).calendar());
        });
    },

    displayPriceNow() {
        this.repositories['NOW']
            .getData()
            .then((_data) => {
                this.setPriceChange();
                this.setLastUpdated();
            })
            .catch(() => {
                this.handleNowRejection();
                this.setPriceChange();
                this.setLastUpdated();
            });

        // Track timeframe changes
        setInterval(this.setLastUpdated.bind(this), 30 * 1000);
    },

    init() {
        this.chart = new App.Chart(this.$chart);

        this.initRepositories();
        this.displayPriceNow();

        this.initEvents();
    },
};

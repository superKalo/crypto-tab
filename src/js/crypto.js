dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_localizedFormat);
dayjs.extend(window.dayjs_plugin_relativeTime);
dayjs.extend(window.dayjs_plugin_calendar);

window.App = window.App || {};

window.App.Crypto = {
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
    $cryptoToggle: document.querySelectorAll('input[name="crypto"]'),
    $cryptoTypeLabel: document.getElementById('crypto-type'),
    currentCrypto: '',

    initEvents() {
        const self = this;

        [...self.$dataPeriods].forEach((el) => {
            el.addEventListener('click', function () {
                self.$dataPeriods.forEach((p) => p.classList.remove('active'));
                this.classList.add('active');

                const period = this.dataset.period;
                self.getCryptoData(period, self.currentCrypto)
                    .then((_data) => self.chart.init(_data))
                    .catch((error) => {
                        self.handleChartRejection(period, self.currentCrypto, error);
                    });

                App.Settings.set('period', this.dataset.period);

                self.setPriceChange(self.currentCrypto);
            });
        });

        [...self.$cryptoToggle].forEach((el) => {
            el.addEventListener('change', function () {
                if (this.checked) {
                    self.currentCrypto = this.value;
                    self.updateCryptoTypeLabel(self.currentCrypto);
                    const period = document.querySelector('.js-period.active').dataset.period;
                    self.getCryptoData(period, self.currentCrypto)
                        .then((_data) => self.chart.init(_data))
                        .catch((error) => {
                            self.handleChartRejection(period, self.currentCrypto, error);
                        });

                    App.Settings.set('cryptoType', self.currentCrypto);

                    self.setPriceChange(self.currentCrypto);
                    self.setLastUpdated();
                    self.displayPriceNow();
                }
            });
        });

        App.Settings.get().then(({ period, cryptoType }) => {
            self.currentCrypto =
                cryptoType || document.querySelector('input[name="crypto"]:checked').value;
            const selectedTab = period ? Object.keys(this.PERIODS).indexOf(period) : 1;
            document.querySelector(`input[name="crypto"][value="${self.currentCrypto}"]`).checked =
                true;
            self.initRepositories();
            self.$dataPeriods[selectedTab].click();
        });
    },

    updateCryptoTypeLabel(cryptoType) {
        const label = cryptoType.charAt(0).toUpperCase() + cryptoType.slice(1);
        this.$cryptoTypeLabel.textContent = label;
    },

    getCryptoData(period, cryptoType) {
        return new Promise((resolve, reject) => {
            this.repositories[cryptoType][period]
                .getData()
                .then((response) => {
                    resolve(response);
                })
                .catch((error) => {
                    reject(error || `Failed to retrieve ${cryptoType} price data`);
                });
        });
    },

    getLabelFormat(period) {
        switch (period) {
            case 'ALL':
                return 'YYYY';
            case 'ONE_YEAR':
                return 'MMM YYYY';
            case 'ONE_MONTH':
                return 'D MMM';
            case 'ONE_WEEK':
                return 'dddd';
            case 'ONE_DAY':
                return 'HH:mm';
            case 'ONE_HOUR':
                return 'HH:mm';
        }
    },

    handleChartRejection(_period, _cryptoType, _error) {
        this.isLocalChartDataOld = true;

        this.repositories[_cryptoType][_period].getDataUpToDateStatus().then((_res) => {
            App.Loader.destroy();

            if (_res.localData === null) {
                App.Message.fireError(`That's extremely sad. ${_error}`);
                this.chart.destroy();
            } else if (_res.localData.length) {
                App.Message.clear();
                this.chart.init(_res.localData);
                this.setLastUpdated();
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

        ['bitcoin', 'ethereum'].forEach((cryptoType) => {
            this.repositories[cryptoType] = {};
            Object.keys(this.PERIODS).forEach((period) => {
                this.repositories[cryptoType][period] = new SuperRepo({
                    storage: storageSetting,
                    name: `${cryptoType}-${period}`,
                    outOfDateAfter: 15 * 60 * 1000, // 15 minutes
                    mapData: (r) => App.API.mapData(r, this.getLabelFormat(period)),
                    request: () =>
                        this.getCryptoDataFromBackground(period, cryptoType)
                            .then((res) => {
                                this.isLocalChartDataOld = false;
                                return res;
                            })
                            .catch((jqXHR, textStatus, errorThrown) => {
                                this.handleChartRejection(period, cryptoType, jqXHR);
                            }),
                });
            });

            this.repositories[cryptoType]['NOW'] = new SuperRepo({
                storage: storageSetting,
                name: `${cryptoType}-NOW`,
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
                    this.getCryptoDataFromBackground('NOW', cryptoType)
                        .then((res) => {
                            this.isLocalNowDataOld = false;
                            return res;
                        })
                        .catch(() => {
                            this.handleNowRejection();
                        }),
            });
        });
    },

    getCryptoDataFromBackground(period, cryptoType) {
        return new Promise((resolve, reject) => {
            window.browser.runtime.sendMessage(
                { type: 'getCryptoPrice', period: period, cryptoType: cryptoType },
                (response) => {
                    if (response && !response.error) {
                        resolve(response.data);
                    } else {
                        reject(response.error || `Failed to retrieve ${cryptoType} price data`);
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
    async setPriceChange(cryptoType) {
        let { localData } = await this.repositories[cryptoType]['NOW'].getDataUpToDateStatus();
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
        const cryptoType = this.currentCrypto;
        this.repositories[cryptoType]['NOW'].getDataUpToDateStatus().then((info) => {
            const prettyLastUpdatedTime = dayjs(info.lastFetched).fromNow();

            // Clear existing content
            this.$lastUpdated.textContent = '';

            const lastUpdatedSpan = document.createElement('span');
            lastUpdatedSpan.className =
                this.isLocalChartDataOld || this.isLocalNowDataOld ? 'negative' : 'positive';
            lastUpdatedSpan.textContent = prettyLastUpdatedTime;

            const failureMessage =
                this.isLocalChartDataOld || this.isLocalNowDataOld
                    ? `. Data request failed. Refresh the page to try again.`
                    : `.`;

            this.$lastUpdated.appendChild(lastUpdatedSpan);
            this.$lastUpdated.appendChild(document.createTextNode(failureMessage));

            this.$lastUpdated.setAttribute('data-tooltip', dayjs(info.lastFetched).calendar());
        });
    },

    displayPriceNow() {
        const cryptoType = this.currentCrypto;
        this.repositories[cryptoType]['NOW']
            .getData()
            .then((_data) => {
                this.setPriceChange(cryptoType);
                this.setLastUpdated();
            })
            .catch(() => {
                this.handleNowRejection();
                this.setPriceChange(cryptoType);
                this.setLastUpdated();
            });

        // Track timeframe changes
        setInterval(this.setLastUpdated.bind(this), 30 * 1000);
    },

    init() {
        this.chart = new App.Chart(this.$chart);

        this.initRepositories();
        this.initEvents();

        App.Settings.get().then(({ cryptoType }) => {
            this.currentCrypto =
                cryptoType || document.querySelector('input[name="crypto"]:checked').value;
            this.updateCryptoTypeLabel(this.currentCrypto);
            this.displayPriceNow();
        });
    },
};

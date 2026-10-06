dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_localizedFormat);
dayjs.extend(window.dayjs_plugin_relativeTime);
dayjs.extend(window.dayjs_plugin_calendar);

window.App = window.App || {};

window.App.Crypto = {
    PERIODS: window.App.CryptoTokens.PERIODS,
    REFRESH_INTERVAL: 30 * 1000,

    $chart: document.getElementById('chart'),
    $change: document.getElementById('change'),
    $cryptoTypeLabel: document.getElementById('crypto-type'),
    $dataPeriods: document.querySelectorAll('.js-period'),
    $lastUpdated: document.getElementById('last-updated'),
    $priceNow: document.getElementById('price-now'),

    chart: null,
    currentCrypto: '',
    currentPeriod: '',
    isInitialized: false,
    refreshTimer: null,
    repositoryClient: null,
    repositoryStatuses: {},
    requestGeneration: 0,

    async init() {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        this.chart = new App.Chart(this.$chart);
        this.repositoryClient = new App.PriceRepositoryClient();

        const settings = await App.Settings.get();
        this.currentCrypto = App.CryptoTokens.isSupportedToken(settings.cryptoType)
            ? settings.cryptoType
            : App.CryptoTokens.getDefaultToken();
        this.currentPeriod = App.CryptoTokens.isChartPeriod(settings.period)
            ? settings.period
            : App.CryptoTokens.getDefaultPeriod();

        if (settings.cryptoType !== this.currentCrypto || settings.period !== this.currentPeriod) {
            App.Settings.setMultiple({
                cryptoType: this.currentCrypto,
                period: this.currentPeriod,
            });
        }

        this.updateCryptoTypeLabel();
        this.updateActivePeriod();
        this.initEvents();
        this.startRefreshTimer();

        await this.loadActiveData(this.requestGeneration);
    },

    initEvents() {
        this.$dataPeriods.forEach((element) => {
            element.addEventListener('click', () => {
                this.changePeriod(element.dataset.period);
            });
        });

        this.handleVisibilityChange = () => {
            if (!document.hidden) {
                this.refreshActiveData();
            }
        };
        this.handlePageHide = () => this.destroy();

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.handlePageHide, { once: true });
    },

    async changePeriod(period) {
        if (!App.CryptoTokens.isChartPeriod(period)) {
            return;
        }

        this.currentPeriod = period;
        this.requestGeneration += 1;
        this.updateActivePeriod();
        this.$change.textContent = '';
        this.updateLastUpdated();
        App.Settings.set('period', period);

        await this.loadActiveData(this.requestGeneration);
    },

    async changeCryptoType(cryptoType) {
        if (!App.CryptoTokens.isSupportedToken(cryptoType) || cryptoType === this.currentCrypto) {
            return;
        }

        this.currentCrypto = cryptoType;
        this.requestGeneration += 1;

        this.chart.destroy();
        this.$priceNow.textContent = '...';
        this.$change.textContent = '';
        this.updateCryptoTypeLabel();
        this.updateLastUpdated();
        App.Message.clear();
        App.Settings.set('cryptoType', cryptoType);

        await this.loadActiveData(this.requestGeneration);
    },

    async loadActiveData(generation) {
        await Promise.allSettled([this.loadChart(generation), this.loadCurrentPrice(generation)]);
    },

    async loadChart(generation) {
        const cryptoType = this.currentCrypto;
        const period = this.currentPeriod;
        const result = await this.repositoryClient.getData(cryptoType, period);

        if (!this.isCurrentRequest(generation, cryptoType, period)) {
            return;
        }

        this.setRepositoryStatus(cryptoType, period, result);
        this.renderChartResult(result, cryptoType);
    },

    async loadCurrentPrice(generation) {
        const cryptoType = this.currentCrypto;
        const result = await this.repositoryClient.getData(cryptoType, 'NOW');

        if (!this.isCurrentRequest(generation, cryptoType)) {
            return;
        }

        this.setRepositoryStatus(cryptoType, 'NOW', result);
        this.renderCurrentPriceResult(result);
    },

    renderChartResult(result, cryptoType) {
        if (!result.ok) {
            App.Message.fireError(
                `Unable to load ${cryptoType} chart data. ${result.error?.message || ''}`.trim()
            );
            this.updateLastUpdated();
            return;
        }

        this.chart.init(result.data, cryptoType);

        if (result.isStale) {
            App.Message.fireError('Showing cached chart data because the latest request failed.');
        } else {
            App.Message.clear();
        }

        this.updateLastUpdated();
    },

    renderCurrentPriceResult(result) {
        if (result.ok) {
            this.setPriceNow(result.data.price);
            this.setPriceChange(result.data.changePercent);
        }

        this.updateLastUpdated();
    },

    isCurrentRequest(generation, cryptoType, period = this.currentPeriod) {
        return (
            generation === this.requestGeneration &&
            cryptoType === this.currentCrypto &&
            period === this.currentPeriod
        );
    },

    updateCryptoTypeLabel() {
        this.$cryptoTypeLabel.textContent = App.CryptoTokens.getDisplayName(this.currentCrypto);
    },

    updateActivePeriod() {
        this.$dataPeriods.forEach((element) => {
            element.classList.toggle('active', element.dataset.period === this.currentPeriod);
        });
    },

    setRepositoryStatus(cryptoType, period, status) {
        this.repositoryStatuses[this.getRepositoryStatusKey(cryptoType, period)] = status;
    },

    getRepositoryStatus(cryptoType, period) {
        return this.repositoryStatuses[this.getRepositoryStatusKey(cryptoType, period)] || null;
    },

    getRepositoryStatusKey(cryptoType, period) {
        return `${cryptoType}:${period}`;
    },

    setPriceNow(price) {
        this.$priceNow.textContent = App.Utils.formatPrice(price, this.currentCrypto);
    },

    setPriceChange(changePercent) {
        const changesByPeriod = {
            ONE_DAY: { value: changePercent.dayAgo, label: 'since yesterday' },
            ONE_WEEK: { value: changePercent.weekAgo, label: 'since last week' },
            ONE_MONTH: { value: changePercent.monthAgo, label: 'since last month' },
        };
        const selectedChange = changesByPeriod[this.currentPeriod];

        this.$change.textContent = '';

        if (!selectedChange || !Number.isFinite(selectedChange.value)) {
            return;
        }

        const isZero = selectedChange.value === 0;
        const changeElement = document.createElement('span');
        changeElement.className = isZero ? '' : selectedChange.value > 0 ? 'positive' : 'negative';
        changeElement.textContent = `${selectedChange.value > 0 ? '+' : ''}${selectedChange.value}%`;

        this.$change.appendChild(document.createTextNode(' ('));
        this.$change.appendChild(changeElement);
        this.$change.appendChild(document.createTextNode(` ${selectedChange.label})`));
    },

    updateLastUpdated() {
        const chartStatus = this.getRepositoryStatus(this.currentCrypto, this.currentPeriod);
        const currentPriceStatus = this.getRepositoryStatus(this.currentCrypto, 'NOW');
        const statuses = [chartStatus, currentPriceStatus].filter(Boolean);
        const lastFetched = currentPriceStatus?.lastFetched || chartStatus?.lastFetched;
        const hasError = statuses.some((status) => !status.ok);
        const hasStaleData = statuses.some((status) => status.isStale);

        this.$lastUpdated.textContent = '';

        if (!lastFetched) {
            this.$lastUpdated.textContent = hasError ? 'unavailable. Data request failed.' : '...';
            this.$lastUpdated.removeAttribute('data-tooltip');
            return;
        }

        const lastUpdatedSpan = document.createElement('span');
        lastUpdatedSpan.className = hasError || hasStaleData ? 'negative' : 'positive';
        lastUpdatedSpan.textContent = dayjs(lastFetched).fromNow();

        this.$lastUpdated.appendChild(lastUpdatedSpan);
        const statusMessage = hasError
            ? '. Some data could not be refreshed.'
            : hasStaleData
              ? '. Showing cached data.'
              : '.';
        this.$lastUpdated.appendChild(document.createTextNode(statusMessage));
        this.$lastUpdated.setAttribute('data-tooltip', dayjs(lastFetched).calendar());
    },

    startRefreshTimer() {
        if (this.refreshTimer) {
            return;
        }

        this.refreshTimer = window.setInterval(() => {
            if (!document.hidden) {
                this.refreshActiveData();
            }
        }, this.REFRESH_INTERVAL);
    },

    refreshActiveData() {
        this.loadActiveData(this.requestGeneration);
        this.updateLastUpdated();
    },

    destroy() {
        if (this.refreshTimer) {
            window.clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }

        if (this.handleVisibilityChange) {
            document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        }
    },
};

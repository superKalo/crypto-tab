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
    $priceHeading: document.getElementById('price-token-picker'),
    $priceNow: document.getElementById('price-now'),
    $retryPrice: document.getElementById('retry-price'),

    chart: null,
    currentCrypto: '',
    currentPeriod: '',
    isInitialized: false,
    refreshTimer: null,
    repositoryClient: null,
    repositoryStatuses: {},
    requestGeneration: 0,
    tokenPicker: null,

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
        this.unsubscribeSettings = App.Settings.subscribe((updated, changedKeys) => {
            this.applySettings(updated, changedKeys);
        });
        this.startRefreshTimer();

        await this.loadActiveData(this.requestGeneration);
    },

    initEvents() {
        this.tokenPicker = new App.TokenPicker({
            container: document.getElementById('price-token-picker'),
            trigger: document.getElementById('price-token-select'),
            options: document.getElementById('price-token-options'),
            menu: document.getElementById('price-token-menu'),
            onSelect: (tokenId) => this.changeCryptoType(tokenId),
            onOpen: () => App.TokenPickerIntro.dismiss(),
        });
        this.tokenPicker.renderSelected(this.currentCrypto);

        this.$dataPeriods.forEach((element) => {
            element.addEventListener('click', () => {
                this.changePeriod(element.dataset.period);
            });
        });

        this.$retryPrice.addEventListener('click', () => {
            this.loadCurrentPrice(this.requestGeneration);
        });

        this.$lastUpdated.querySelectorAll('.update-trigger').forEach((trigger) => {
            const showTooltip = () => trigger.classList.remove('tooltip-dismissed');
            trigger.addEventListener('mouseenter', showTooltip);
            trigger.addEventListener('focusin', showTooltip);
        });
        this.handleTooltipEscape = (event) => {
            if (event.key === 'Escape') {
                this.$lastUpdated.querySelectorAll('.update-trigger').forEach((trigger) => {
                    trigger.classList.add('tooltip-dismissed');
                });
            }
        };
        document.addEventListener('keydown', this.handleTooltipEscape);

        this.handleVisibilityChange = () => {
            if (!document.hidden) {
                this.refreshActiveData();
            }
        };
        this.handlePageHide = (event) => {
            // A cached page keeps its settings subscription; the browser pauses its timers.
            if (!event.persisted) {
                this.destroy();
            }
        };

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.handlePageHide);
    },

    async changePeriod(period) {
        if (!App.CryptoTokens.isChartPeriod(period)) {
            return;
        }

        if (period !== this.currentPeriod) {
            this.chart.destroy();
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
        this.setRepositoryStatus(cryptoType, 'NOW', null);
        this.$priceNow.textContent = 'Loading…';
        this.$change.textContent = '';
        this.$retryPrice.classList.add('hidden');
        this.updateCryptoTypeLabel();
        this.updateLastUpdated();
        App.Message.clear();
        App.Settings.set('cryptoType', cryptoType);

        await this.loadActiveData(this.requestGeneration);
    },

    applySettings(settings, changedKeys) {
        const cryptoType = changedKeys.includes('cryptoType')
            ? App.CryptoTokens.isSupportedToken(settings.cryptoType)
                ? settings.cryptoType
                : App.CryptoTokens.getDefaultToken()
            : this.currentCrypto;
        const period = changedKeys.includes('period')
            ? App.CryptoTokens.isChartPeriod(settings.period)
                ? settings.period
                : App.CryptoTokens.getDefaultPeriod()
            : this.currentPeriod;

        if (cryptoType === this.currentCrypto && period === this.currentPeriod) {
            return;
        }

        const tokenChanged = cryptoType !== this.currentCrypto;
        this.currentCrypto = cryptoType;
        this.currentPeriod = period;
        this.requestGeneration += 1;
        this.chart.destroy();
        this.$change.textContent = '';

        if (tokenChanged) {
            this.setRepositoryStatus(cryptoType, 'NOW', null);
            this.$priceNow.textContent = 'Loading…';
            this.$retryPrice.classList.add('hidden');
            this.updateCryptoTypeLabel();
        }

        this.updateActivePeriod();
        this.updateLastUpdated();
        App.Message.clear();
        // Apply the complete context once without persisting the received change again.
        this.loadActiveData(this.requestGeneration);
    },

    async loadActiveData(generation) {
        await Promise.allSettled([this.loadChart(generation), this.loadCurrentPrice(generation)]);
    },

    async loadChart(generation) {
        const cryptoType = this.currentCrypto;
        const period = this.currentPeriod;

        if (!this.chart.isInitiated()) {
            this.setRepositoryStatus(cryptoType, period, null);
            App.Message.show('Loading chart…');
            this.updateLastUpdated();
        }

        const result = await this.repositoryClient.getData(cryptoType, period);

        if (!this.isCurrentRequest(generation, cryptoType, period)) {
            return;
        }

        this.setRepositoryStatus(cryptoType, period, result);
        this.renderChartResult(result, cryptoType);
    },

    async loadCurrentPrice(generation) {
        const cryptoType = this.currentCrypto;
        this.$retryPrice.disabled = true;
        this.$retryPrice.textContent = 'Retrying…';

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
                `Unable to load ${App.CryptoTokens.getDisplayName(cryptoType)} chart data. Will retry automatically.`
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
        this.$retryPrice.disabled = false;
        this.$retryPrice.textContent = 'Retry price';
        this.$retryPrice.classList.toggle('hidden', result.ok);

        if (result.ok) {
            this.setPriceNow(result.data.price);
            this.setPriceChange(result.data.changePercent);
        } else {
            this.$priceNow.textContent = 'unavailable';
            this.$change.textContent = '';
        }

        // Reveal the complete first result without recentering a visible loading placeholder.
        const isFirstPriceResult = this.$priceHeading.getAttribute('aria-busy') === 'true';
        this.$priceHeading.setAttribute('aria-busy', 'false');
        if (isFirstPriceResult) {
            App.TokenPickerIntro.init();
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
        const token = App.CryptoTokens.getToken(this.currentCrypto);
        this.$cryptoTypeLabel.textContent = token.displayName;
        document.getElementById('price-token-logo').src = token.logoPath;

        const trigger = document.getElementById('price-token-select');
        trigger.style.setProperty('--token-color', token.textColor);
        trigger.style.setProperty('--token-color-dark', token.darkTextColor);
        trigger.setAttribute('aria-label', `Change token: ${token.displayName} (${token.symbol})`);
        this.tokenPicker?.renderSelected(this.currentCrypto);
        App.SettingsPanel?.renderSelectedToken(this.currentCrypto);
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
        this.renderUpdateStatus('Price', 'NOW', 'price');
        this.renderUpdateStatus('Chart', this.currentPeriod, 'chart');
    },

    renderUpdateStatus(label, period, elementPrefix) {
        const status = this.getRepositoryStatus(this.currentCrypto, period);
        const policy = App.CryptoTokens.getRefreshPolicy(period);
        const summary = document.getElementById(`${elementPrefix}-update-status`);
        const statusLabel = document.getElementById(`${elementPrefix}-update-label`);
        const age = document.getElementById(`${elementPrefix}-update-time`);
        const note = document.getElementById(`${elementPrefix}-update-note`);
        const details = document.getElementById(`${elementPrefix}-update-details`);
        const description = [policy?.description || 'Checking data…'];

        summary.classList.toggle('negative', Boolean(status && (!status.ok || status.isStale)));
        statusLabel.textContent = label;
        note.textContent = '';

        if (!status) {
            age.textContent = 'loading…';
            description.push('Checking for data…');
        } else if (!status.ok) {
            age.textContent = 'unavailable';
            description.push(
                'The latest refresh failed. Retrying automatically while this tab is visible.'
            );
        } else if (!status.lastFetched) {
            age.textContent = 'update time unavailable';
        } else {
            const hourCycle = App.Clock?.format === '12h' ? 'h12' : 'h23';
            const updatedAt = new Intl.DateTimeFormat(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
                hourCycle,
            }).format(status.lastFetched);
            statusLabel.textContent = `${label} updated`;
            age.textContent = dayjs(status.lastFetched)
                .fromNow()
                .replace('a few seconds', 'few sec')
                .replace('a minute', '1 min')
                .replace(/\bminutes?\b/g, 'min');
            description.push(`Last refreshed: ${updatedAt}.`);

            if (status.isStale) {
                note.textContent = '· Cached data';
                description.push(
                    'The latest refresh failed. Retrying automatically while this tab is visible.'
                );
            } else {
                const nextRefreshAt = App.CryptoTokens.getNextRefreshAt(period, status.lastFetched);
                if (nextRefreshAt > Date.now()) {
                    const time = new Intl.DateTimeFormat(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hourCycle,
                    }).format(nextRefreshAt);
                    description.push(`Next refresh around ${time}, while this tab is visible.`);
                } else {
                    description.push('Checking for updates…');
                }
            }
        }

        age.setAttribute('aria-label', `${statusLabel.textContent} ${age.textContent}`);
        details.textContent = description.join('\n\n');
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
        if (this.handlePageHide) {
            window.removeEventListener('pagehide', this.handlePageHide);
        }
        if (this.handleTooltipEscape) {
            document.removeEventListener('keydown', this.handleTooltipEscape);
        }
        this.unsubscribeSettings?.();
    },
};

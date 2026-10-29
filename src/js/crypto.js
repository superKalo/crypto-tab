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

    chart: null,
    currentCrypto: '',
    currentPeriod: '',
    isInitialized: false,
    priceHeadingKey: null,
    refreshTimer: null,
    repositoryClient: null,
    repositoryStatuses: {},
    requestGeneration: 0,
    tokenPicker: null,
    celebrationDayChange: null,
    celebrationDemo: false,

    async init() {
        if (this.isInitialized) {
            return;
        }

        this.isInitialized = true;
        const preview = new URLSearchParams(window.location.search);
        this.celebration = new App.TokenCelebration(
            document.getElementById('token-fire'),
            document.getElementById('price-token-select'),
            preview.get('effect') === 'fire' ? 'fire' : 'confetti'
        );
        // Temporary opt-in preview; simulated values never enter the repository or storage.
        this.celebrationDemo = preview.get('celebration') === 'demo';
        if (this.celebrationDemo) {
            this.$celebrationDemo = document.createElement('p');
            this.$celebrationDemo.className = 'celebration-demo';
            this.$celebrationDemo.textContent = 'Demo: +6% (24h)';
            this.$priceHeading.querySelector('.chart-period').after(this.$celebrationDemo);
        }
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

        this.handleClockFormatChange = () => this.updateLastUpdated();
        window.addEventListener('clockformatchange', this.handleClockFormatChange);

        this.handleVisibilityChange = () => {
            this.updateCelebration();
            if (!document.hidden) {
                this.refreshActiveData();
            }
        };
        this.handlePageHide = (event) => {
            this.celebration.setActive(false);
            // A cached page keeps its settings subscription; the browser pauses its timers.
            if (!event.persisted) {
                this.destroy();
            }
        };
        this.handlePageShow = () => this.updateCelebration();

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('pagehide', this.handlePageHide);
        window.addEventListener('pageshow', this.handlePageShow);
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
        this.$priceNow.textContent = App.I18n.t('price.loading');
        this.renderPriceHeading('price.headingLoading');
        this.$priceNow.removeAttribute('aria-label');
        this.$change.textContent = '';
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
            this.$priceNow.textContent = App.I18n.t('price.loading');
            this.renderPriceHeading('price.headingLoading');
            this.$priceNow.removeAttribute('aria-label');
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
            App.Message.show(App.I18n.t('chart.loading'));
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
                App.I18n.t('errors.chartUnavailable', {
                    token: App.CryptoTokens.getDisplayName(cryptoType),
                    seconds: this.REFRESH_INTERVAL / 1000,
                })
            );
            this.updateLastUpdated();
            return;
        }

        this.chart.init(result.data, cryptoType, this.currentPeriod);

        App.Message.clear();

        this.updateLastUpdated();
    },

    renderCurrentPriceResult(result) {
        this.celebrationDayChange =
            result.ok && !result.isStale ? result.data.changePercent.dayAgo : null;
        this.updateCelebration();
        if (result.ok) {
            this.setPriceNow(result.data.price);
            this.setPriceChange(
                this.celebrationDemo
                    ? { ...result.data.changePercent, dayAgo: 6 }
                    : result.data.changePercent
            );
        } else {
            this.$priceNow.textContent = App.I18n.t('price.unavailable');
            this.$priceNow.setAttribute('aria-label', App.I18n.t('price.unavailableLabel'));
            this.renderPriceHeading('price.headingUnavailable');
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
        this.celebrationDayChange = null;
        this.updateCelebration();
        const token = App.CryptoTokens.getToken(this.currentCrypto);
        this.$cryptoTypeLabel.textContent = token.displayName;
        document.getElementById('price-token-logo').src = token.logoPath;

        const trigger = document.getElementById('price-token-select');
        trigger.style.setProperty('--token-color', token.textColor);
        trigger.style.setProperty('--token-color-dark', token.darkTextColor);
        trigger.setAttribute(
            'aria-label',
            App.I18n.t('token.changeLabel', { name: token.displayName, symbol: token.symbol })
        );
        this.renderPriceHeading(this.priceHeadingKey || 'price.headingLoading');
        this.tokenPicker?.renderSelected(this.currentCrypto);
        App.SettingsPanel?.renderSelectedToken(this.currentCrypto);
    },

    updateCelebration() {
        const qualifies =
            this.celebrationDemo ||
            (Number.isFinite(this.celebrationDayChange) && this.celebrationDayChange >= 5);
        this.celebration?.setActive(this.isInitialized && !document.hidden && qualifies);
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
        this.$priceNow.removeAttribute('aria-label');
        this.$priceNow.textContent = App.Utils.formatPrice(price, this.currentCrypto);
        this.renderPriceHeading();
    },

    renderPriceHeading(key = 'price.heading') {
        if (this.priceHeadingKey === key) {
            return;
        }

        const token = document.getElementById('price-token-select');
        const heading = this.$priceHeading.querySelector('h2');
        const focusedElement = heading.contains(document.activeElement)
            ? document.activeElement
            : null;
        const template = App.I18n.t(key);
        const parts = template.split(/(\{token\}|\{price\})/).map((part) => {
            if (part === '{token}') {
                return token;
            }
            if (part === '{price}') {
                return this.$priceNow;
            }
            return document.createTextNode(part);
        });

        // Preserve the picker and price nodes while allowing each language its own word order.
        heading.replaceChildren(...parts, this.$change);
        this.priceHeadingKey = key;
        focusedElement?.focus({ preventScroll: true });
    },

    setPriceChange(changePercent) {
        const changesByPeriod = {
            ONE_DAY: changePercent.dayAgo,
            ONE_WEEK: changePercent.weekAgo,
            ONE_MONTH: changePercent.monthAgo,
        };
        const selectedChange = changesByPeriod[this.currentPeriod];

        this.$change.textContent = '';

        if (!Number.isFinite(selectedChange)) {
            return;
        }

        const isZero = selectedChange === 0;
        const changeElement = document.createElement('span');
        changeElement.className = isZero ? '' : selectedChange > 0 ? 'positive' : 'negative';
        changeElement.textContent = App.Utils.formatPercent(selectedChange);

        const [before, after] = App.I18n.t(`price.change.${this.currentPeriod}`).split('{change}');
        this.$change.append(
            document.createTextNode(before),
            changeElement,
            document.createTextNode(after)
        );
    },

    updateLastUpdated() {
        this.renderUpdateStatus('price', 'NOW');
        this.renderUpdateStatus('chart', this.currentPeriod);
        this.renderCombinedUpdateStatus();
    },

    getLocalizedRefreshPolicy(period) {
        const policies = {
            NOW: 'current',
            ONE_HOUR: 'samples',
            ONE_DAY: 'hourly',
            ONE_WEEK: 'daily',
            ONE_MONTH: 'daily',
            ONE_YEAR: 'monthly',
            ALL: 'monthly',
        };
        const policy = App.CryptoTokens.getRefreshPolicy(period);
        const type = policies[period];
        const values = { minutes: policy.interval / (60 * 1000) };

        return {
            summary: App.I18n.t(`status.policy.${type}.summary`, values),
            description: App.I18n.t(`status.policy.${type}.description`, values),
        };
    },

    renderCombinedUpdateStatus() {
        const periods = ['NOW', this.currentPeriod];
        const statuses = periods.map((period) =>
            this.getRepositoryStatus(this.currentCrypto, period)
        );
        const now = Date.now();
        const combined = statuses.every((status, index) => {
            const nextRefreshAt = App.CryptoTokens.getNextRefreshAt(
                periods[index],
                status?.lastFetched
            );

            // Allow one UI check to refresh data due on independent schedules.
            return (
                status?.ok &&
                !status.error &&
                !status.isStale &&
                status.lastFetched <= now &&
                nextRefreshAt !== null &&
                now < nextRefreshAt + this.REFRESH_INTERVAL
            );
        });

        this.$lastUpdated.classList.toggle('data-updates-combined', combined);
        document.getElementById('combined-update-status').hidden = !combined;

        if (!combined) {
            return;
        }

        // The older refresh represents how recently both sets of data were updated.
        const lastFetched = Math.min(...statuses.map((status) => status.lastFetched));
        const age = dayjs(lastFetched).locale(this.getRelativeTimeLocale()).fromNow();
        document.getElementById('combined-update-age').textContent = age;
        document
            .getElementById('combined-update-time')
            .setAttribute('aria-label', App.I18n.t('status.combinedAgeLabel', { age }));

        ['price', 'chart'].forEach((label, index) => {
            document.getElementById(`combined-${label}-time`).textContent = this.formatUpdateTime(
                statuses[index].lastFetched
            );
            const policy = this.getLocalizedRefreshPolicy(periods[index]);
            if (label === 'chart') {
                document.getElementById('combined-chart-summary').textContent = policy.summary;
            }
            document.getElementById(`combined-${label}-description`).textContent =
                policy.description;
        });

        const nextRefreshAt = Math.min(
            ...periods.map((period, index) =>
                App.CryptoTokens.getNextRefreshAt(period, statuses[index].lastFetched)
            )
        );
        const footnote = document.getElementById('combined-next-refresh');

        if (nextRefreshAt > now) {
            const time = this.formatUpdateTime(nextRefreshAt, {
                hour: '2-digit',
                minute: '2-digit',
            });
            footnote.textContent = App.I18n.t('status.nextRefresh', { time });
        } else {
            footnote.textContent = App.I18n.t('status.checkingVisible');
        }
    },

    formatUpdateTime(timestamp, options = { timeStyle: 'medium' }) {
        const is12Hour = App.Clock?.format === '12h';
        if (is12Hour && options.dateStyle) {
            // Translate the date while keeping the time in the same English AM/PM format.
            const { dateStyle, ...timeOptions } = options;
            const date = new Intl.DateTimeFormat(App.I18n.locale, { dateStyle }).format(timestamp);
            return `${date}, ${this.formatUpdateTime(timestamp, timeOptions)}`;
        }

        return new Intl.DateTimeFormat(is12Hour ? 'en-US' : App.I18n.locale, {
            ...options,
            hourCycle: is12Hour ? 'h12' : 'h23',
        }).format(timestamp);
    },

    getRelativeTimeLocale() {
        if (App.I18n.locale === 'sr') {
            return 'sr-cyrl';
        }
        return App.I18n.locale === 'pt-PT' ? 'pt' : App.I18n.locale.toLowerCase();
    },

    renderUpdateStatus(label, period) {
        const status = this.getRepositoryStatus(this.currentCrypto, period);
        const policy = this.getLocalizedRefreshPolicy(period);
        const statusLabel = document.getElementById(`${label}-update-label`);
        const age = document.getElementById(`${label}-update-time`);
        const details = document.getElementById(`${label}-update-details`);
        const notices = [];
        let lastRefreshedLabel = '';

        statusLabel.textContent = App.I18n.t(`status.${label}.label`);
        age.classList.toggle('negative', Boolean(status && (!status.ok || status.isStale)));

        if (!status) {
            age.textContent = App.I18n.t('status.loading');
            notices.push(App.I18n.t('status.checkingData'));
        } else if (!status.ok) {
            age.textContent = App.I18n.t('status.unavailable');
            notices.push(App.I18n.t('status.refreshFailed'));
        } else if (!status.lastFetched) {
            age.textContent = App.I18n.t('status.timeUnavailable');
        } else {
            const updatedAt = this.formatUpdateTime(status.lastFetched, {
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            statusLabel.textContent = App.I18n.t(`status.${label}.updated`);
            age.textContent = dayjs(status.lastFetched)
                .locale(this.getRelativeTimeLocale())
                .fromNow();
            lastRefreshedLabel = App.I18n.t('status.lastRefreshed', { time: updatedAt });

            if (status.isStale) {
                notices.push(
                    App.I18n.t(`status.cached.${label}`, {
                        seconds: this.REFRESH_INTERVAL / 1000,
                    })
                );
            } else {
                const nextRefreshAt = App.CryptoTokens.getNextRefreshAt(period, status.lastFetched);
                if (nextRefreshAt > Date.now()) {
                    const time = this.formatUpdateTime(nextRefreshAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                    notices.push(App.I18n.t('status.nextRefresh', { time }));
                } else {
                    notices.push(App.I18n.t('status.checkingUpdates'));
                }
            }
        }

        age.setAttribute(
            'aria-label',
            App.I18n.t('status.ageLabel', { label: statusLabel.textContent, age: age.textContent })
        );
        this.renderUpdateDetails(details, { policy, notices, lastRefreshedLabel }, label, status);
    },

    renderUpdateDetails(details, { policy, notices, lastRefreshedLabel }, label, status) {
        const formatted = Boolean(status);
        details.classList.toggle('update-details-formatted', formatted);

        if (!formatted) {
            details.textContent = [App.I18n.t('status.policyOverview', policy), ...notices].join(
                '\n\n'
            );
            return;
        }

        const section = document.createElement('span');
        section.className = 'update-details-section';
        const header = document.createElement('span');
        header.className = 'update-details-row';
        const title = document.createElement('span');
        title.className = 'update-details-title';
        title.textContent = App.I18n.t(
            label === 'price' ? 'status.priceTitle' : 'status.chartTitle'
        );

        if (label === 'chart') {
            const context = document.createElement('span');
            context.className = 'update-details-context';
            context.textContent = App.I18n.t('status.context', { summary: policy.summary });
            title.appendChild(context);
        }

        header.appendChild(title);

        if (Number.isFinite(status.lastFetched) && status.lastFetched > 0) {
            const time = document.createElement('time');
            const isSuccess = status.ok && !status.isStale && !status.error;
            time.className = `update-details-time ${isSuccess ? 'positive' : 'negative'}`;
            time.dateTime = new Date(status.lastFetched).toISOString();
            time.textContent = this.formatUpdateTime(status.lastFetched);
            time.setAttribute(
                'aria-label',
                lastRefreshedLabel || App.I18n.t('status.lastRefreshed', { time: time.textContent })
            );
            header.appendChild(time);
        }

        const body = document.createElement('span');
        body.className = 'update-details-description';
        body.textContent = policy.description;
        section.appendChild(header);
        section.appendChild(body);

        const noticeElements = notices.map((text) => {
            const notice = document.createElement('span');
            notice.className =
                'update-details-section update-details-description update-details-notice';
            notice.textContent = text;
            return notice;
        });

        details.replaceChildren(section, ...noticeElements);
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
        this.isInitialized = false;
        this.celebrationDayChange = null;
        this.celebrationDemo = false;
        this.updateCelebration();
        this.$celebrationDemo?.remove();
        this.celebration?.destroy();
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
        if (this.handlePageShow) {
            window.removeEventListener('pageshow', this.handlePageShow);
        }
        if (this.handleTooltipEscape) {
            document.removeEventListener('keydown', this.handleTooltipEscape);
        }
        if (this.handleClockFormatChange) {
            window.removeEventListener('clockformatchange', this.handleClockFormatChange);
        }
        this.unsubscribeSettings?.();
    },
};

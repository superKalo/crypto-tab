window.App = window.App || {};

/**
 * Simple and efficient clock with system, 12h, and 24h format preferences.
 */
window.App.Clock = {
    format: '24h',
    formatPreference: 'system',
    timer: null,
    isInitialized: false,
    isPageActive: false,
    settingsGeneration: 0,

    async init() {
        if (this.isInitialized) {
            return;
        }

        this.$time = document.getElementById('clock-time');
        this.$period = document.getElementById('clock-period');
        this.isInitialized = true;
        this.isPageActive = true;

        this.handleVisibilityChange = () => this.update();
        this.handleFocus = () => this.update();
        this.handleLanguageChange = () => this.update();
        this.handlePageHide = (event) => {
            this.isPageActive = false;
            this.stop();

            // Cached pages retain their listeners so pageshow can restart the clock.
            if (!event.persisted) {
                this.destroy();
            }
        };
        this.handlePageShow = () => {
            this.isPageActive = true;
            this.update();
        };

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('focus', this.handleFocus);
        window.addEventListener('languagechange', this.handleLanguageChange);
        window.addEventListener('pagehide', this.handlePageHide);
        window.addEventListener('pageshow', this.handlePageShow);
        this.unsubscribeSettings = window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('clockFormat')) {
                this.updateFormat(settings.clockFormat);
            }
        });
        this.update();

        const generation = ++this.settingsGeneration;
        try {
            const settings = await window.App.Settings.get();

            // A late read must not overwrite a newer preference or restart a destroyed clock.
            if (generation === this.settingsGeneration) {
                this.updateFormat(settings.clockFormat);
            }
        } catch (error) {
            console.warn('Unable to load clock preferences. Keeping the current format.', error);
        }
    },

    normalizeFormat(format) {
        return ['system', '12h', '24h'].includes(format) ? format : 'system';
    },

    resolveFormat(format) {
        if (format !== 'system') {
            return format;
        }

        // Browsers expose the default locale's hour cycle through Intl.
        return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12
            ? '12h'
            : '24h';
    },

    formatTime(date, format) {
        const hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return {
            time: `${format === '12h' ? hours % 12 || 12 : hours}:${minutes}`,
            period: format === '12h' ? (hours >= 12 ? 'PM' : 'AM') : '',
        };
    },

    updateFormat(format) {
        this.settingsGeneration += 1;
        this.formatPreference = this.normalizeFormat(format);
        this.update();
    },

    update() {
        this.stop();

        if (!this.isInitialized) {
            return;
        }

        const previousFormat = this.format;
        this.format = this.resolveFormat(this.formatPreference);
        if (this.format !== previousFormat) {
            window.dispatchEvent(new Event('clockformatchange'));
        }

        if (!this.isPageActive || document.hidden) {
            return;
        }

        const now = new Date();
        const { time, period } = this.formatTime(now, this.format);
        if (this.$time.textContent !== time) {
            this.$time.textContent = time;
        }
        if (this.$period.textContent !== period) {
            this.$period.textContent = period;
        }
        this.$period.hidden = period === '';

        // Schedule from the rendered time so a minute rollover cannot skip the next tick.
        const delay = 60 * 1000 - (now.getTime() % (60 * 1000));
        this.timer = window.setTimeout(() => this.update(), delay);
    },

    stop() {
        if (this.timer !== null) {
            window.clearTimeout(this.timer);
            this.timer = null;
        }
    },

    destroy() {
        if (!this.isInitialized) {
            return;
        }

        this.stop();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('focus', this.handleFocus);
        window.removeEventListener('languagechange', this.handleLanguageChange);
        window.removeEventListener('pagehide', this.handlePageHide);
        window.removeEventListener('pageshow', this.handlePageShow);
        this.unsubscribeSettings();
        this.isInitialized = false;
        this.isPageActive = false;
        this.settingsGeneration += 1;
    },
};

// Render before the deferred chart scripts load; the clock has no chart dependencies.
window.App.Clock.init().catch((error) => {
    window.App.Message.fireError(`Unable to initialize the clock. ${error.message}`);
});

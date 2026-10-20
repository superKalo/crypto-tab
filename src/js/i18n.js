window.App = window.App || {};
document.documentElement.classList.add('i18n-pending');

window.App.I18n = {
    SUPPORTED_LOCALES: App.LocaleConfig.SUPPORTED_LOCALES,
    preference: 'system',
    locale: App.LocaleConfig.resolveLocale(navigator.languages || [navigator.language]),
    hasLoaded: false,
    pendingPreference: null,
    isReloading: false,

    normalizePreference(value) {
        return App.LocaleConfig.normalizePreference(value);
    },

    resolveLocale(languages) {
        return App.LocaleConfig.resolveLocale(languages);
    },

    reload() {
        if (!this.isReloading) {
            this.isReloading = true;
            window.location.reload();
        }
    },

    t(key, parameters = {}) {
        const catalogs = App.LocaleCatalogs || {};
        const message = catalogs[this.locale]?.[key] ?? catalogs.en?.[key] ?? key;
        return message.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (placeholder, name) =>
            Object.hasOwn(parameters, name) ? String(parameters[name]) : placeholder
        );
    },

    apply(root = document) {
        const attributes = {
            'data-i18n': null,
            'data-i18n-aria-label': 'aria-label',
            'data-i18n-title': 'title',
            'data-i18n-placeholder': 'placeholder',
            'data-i18n-content': 'content',
        };

        Object.entries(attributes).forEach(([marker, attribute]) => {
            const elements = [...root.querySelectorAll(`[${marker}]`)];
            if (root.matches?.(`[${marker}]`)) {
                elements.unshift(root);
            }
            elements.forEach((element) => {
                const text = this.t(element.getAttribute(marker));
                if (attribute) {
                    element.setAttribute(attribute, text);
                } else {
                    element.textContent = text;
                }
            });
        });
    },

    async init() {
        if (App.Settings) {
            // Subscribe before the initial asynchronous read so loading tabs cannot miss a change.
            App.Settings.subscribe((settings, changedKeys) => {
                if (!changedKeys.includes('language')) {
                    return;
                }
                this.pendingPreference = this.normalizePreference(settings.language);
                if (this.hasLoaded && this.pendingPreference !== this.preference) {
                    this.reload();
                }
            });
        }
        try {
            let preference;
            if (App.Settings) {
                preference = (await App.Settings.get()).language;
            } else {
                // The standalone feedback page shares the website's saved language only.
                preference = JSON.parse(window.localStorage.getItem('settings'))?.language;
            }
            this.preference = this.normalizePreference(preference);
        } catch (error) {
            console.warn(
                'Unable to read the language preference. Using the browser language.',
                error
            );
        }

        if (document.readyState === 'loading') {
            await new Promise((resolve) => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }
        this.preference = this.pendingPreference ?? this.preference;
        this.locale =
            this.preference === 'system'
                ? this.resolveLocale(navigator.languages || [navigator.language])
                : this.preference;
        document.documentElement.lang = this.locale;
        this.apply();
        if (App.ENV?.platform === 'EXTENSION') {
            document.title = this.t('metadata.newTabTitle');
        }
        document.documentElement.classList.remove('i18n-pending');
        this.hasLoaded = true;
    },
};

App.I18n.ready = App.I18n.init();

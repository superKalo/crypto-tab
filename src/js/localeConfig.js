globalThis.App = globalThis.App || {};

globalThis.App.LocaleConfig = {
    SUPPORTED_LOCALES: ['en', 'pt-BR', 'pt-PT', 'es', 'fr', 'id'],

    normalizePreference(value) {
        return value === 'system' || this.SUPPORTED_LOCALES.includes(value) ? value : 'system';
    },

    resolveLocale(languages = []) {
        const preferences = Array.isArray(languages) ? languages : [languages];

        for (const language of preferences) {
            if (typeof language !== 'string') {
                continue;
            }

            const normalized = language.replace(/_/g, '-').toLowerCase();
            const base = normalized.split('-')[0];
            if (base === 'pt') {
                return normalized === 'pt-pt' ? 'pt-PT' : 'pt-BR';
            }
            if (this.SUPPORTED_LOCALES.includes(base)) {
                return base;
            }
        }

        return 'en';
    },
};

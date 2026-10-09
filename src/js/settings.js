window.App = window.App || {};

window.App.Settings = {
    initialState: {
        period: '',
    },
    listeners: new Set(),
    changeGeneration: 0,

    async isHintDismissed(id) {
        if (App.ENV.platform === 'EXTENSION') {
            const stored = await window.browser.storage.local.get(id);
            return stored[id] === true;
        }

        return window.localStorage.getItem(id) === 'true';
    },

    async dismissHint(id) {
        // Keep hint flags separate so concurrent preference writes cannot overwrite them.
        if (App.ENV.platform === 'EXTENSION') {
            await window.browser.storage.local.set({ [id]: true });
        } else {
            window.localStorage.setItem(id, 'true');
        }
    },

    set(_item, _value) {
        return this.setMultiple({ [_item]: _value });
    },

    async setMultiple(items) {
        try {
            if (App.ENV.platform === 'EXTENSION') {
                const result = await window.browser.runtime.sendMessage({
                    type: 'updateSettings',
                    settings: items,
                });

                if (!result?.ok) {
                    throw new Error(result?.error || 'The extension could not save preferences');
                }
            } else {
                const stored = JSON.parse(window.localStorage.getItem('settings'));
                const settings = { ...this.initialState, ...stored, ...items };
                window.localStorage.setItem('settings', JSON.stringify(settings));
            }

            return true;
        } catch (error) {
            console.warn('Unable to save preferences.', error);
            return false;
        }
    },

    async get() {
        let generation;
        let settings;

        do {
            generation = this.changeGeneration;
            if (App.ENV.platform === 'EXTENSION') {
                const stored = await window.browser.storage.local.get('settings');
                settings = stored.settings;
            } else {
                settings = JSON.parse(window.localStorage.getItem('settings'));
            }
            // Re-read if a storage event overtook the asynchronous extension read.
        } while (generation !== this.changeGeneration);

        return { ...this.initialState, ...settings };
    },

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    },

    notifyChanges(previous, current) {
        const oldSettings = { ...this.initialState, ...previous };
        const settings = { ...this.initialState, ...current };
        const keys = new Set([...Object.keys(oldSettings), ...Object.keys(settings)]);
        const changedKeys = [...keys].filter((key) => oldSettings[key] !== settings[key]);

        if (!changedKeys.length) {
            return;
        }

        this.changeGeneration += 1;
        this.listeners.forEach((listener) => {
            try {
                listener(settings, changedKeys);
            } catch (error) {
                console.warn('Unable to apply updated preferences.', error);
            }
        });
    },
};

if (App.ENV.platform === 'EXTENSION') {
    window.browser.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.settings) {
            App.Settings.notifyChanges(changes.settings.oldValue, changes.settings.newValue);
        }
    });
} else {
    window.addEventListener('storage', (event) => {
        if (event.storageArea !== window.localStorage || event.key !== 'settings') {
            return;
        }

        try {
            App.Settings.notifyChanges(JSON.parse(event.oldValue), JSON.parse(event.newValue));
        } catch (error) {
            console.warn('Unable to read updated preferences.', error);
        }
    });
}

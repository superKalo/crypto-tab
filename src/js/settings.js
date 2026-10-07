window.App = window.App || {};

window.App.Settings = {
    initialState: {
        period: '',
    },

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
        if (App.ENV.platform === 'EXTENSION') {
            window.browser.storage.local.get('settings', (_res) => {
                window.browser.storage.local.set({
                    settings: Object.assign(this.initialState, _res.settings || {}, {
                        [_item]: _value,
                    }),
                });
            });
        } else {
            const localStorageSettings = JSON.parse(window.localStorage.getItem('settings'));

            window.localStorage.setItem(
                'settings',
                JSON.stringify(
                    Object.assign(this.initialState, localStorageSettings || {}, {
                        [_item]: _value,
                    })
                )
            );
        }
    },

    setMultiple(_items) {
        if (App.ENV.platform === 'EXTENSION') {
            window.browser.storage.local.get('settings', (_res) => {
                window.browser.storage.local.set({
                    settings: Object.assign(this.initialState, _res.settings || {}, _items),
                });
            });
        } else {
            const localStorageSettings = JSON.parse(window.localStorage.getItem('settings'));

            window.localStorage.setItem(
                'settings',
                JSON.stringify(Object.assign(this.initialState, localStorageSettings || {}, _items))
            );
        }
    },

    get() {
        if (App.ENV.platform === 'EXTENSION') {
            return new Promise((_resolve) => {
                window.browser.storage.local.get('settings', (_res) =>
                    _resolve(_res.settings || this.initialState)
                );
            });
        } else {
            return new Promise((_resolve) =>
                _resolve(JSON.parse(window.localStorage.getItem('settings')) || this.initialState)
            );
        }
    },
};

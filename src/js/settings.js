window.App = window.App || {};

window.App.Settings = {
    initialState: {
        period: ''
    },

    set(_item, _value) {
        if (App.ENV.platform === 'EXTENSION') {
            window.browser.storage.local.get('settings', _res => {
                window.browser.storage.local.set({
                    settings: Object.assign(this.initialState, _res.settings || {}, {
                        [_item]: _value
                    })
                });
            });
        } else {
            const localStorageSettings =
                JSON.parse(window.localStorage.getItem('settings'));

            window.localStorage.setItem('settings', JSON.stringify(
                Object.assign(this.initialState, localStorageSettings || {}, {
                    [_item]: _value
                })
            ));
        }
    },

    get() {
        if (App.ENV.platform === 'EXTENSION') {
            return new Promise(_resolve => {
                window.browser.storage.local.get('settings', _res =>
                    _resolve(_res.settings || this.initialState)
                );
            });
        } else {
            return new Promise(_resolve => _resolve(
                JSON.parse(window.localStorage.getItem('settings')) || this.initialState
            ));
        }
    }
};

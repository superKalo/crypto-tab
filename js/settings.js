window.App = window.App || {};

window.App.Settings = {
    initialState: {
        period: ''
    },

    set(_item, _value) {
        window.browser.storage.local.get('settings', _res => {
            window.browser.storage.local.set({
                settings: Object.assign(this.initialState, _res.settings || {}, {
                    [_item]: _value
                })
            });
        });
    },

    get() {
        return new Promise(_resolve => {
            window.browser.storage.local.get('settings', _res =>
                _resolve(_res.settings || this.initialState)
            );
        });
    }
};

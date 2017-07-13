window.App = window.App || {};

window.App.API = {
    baseURL: 'fake-api/',

    fetch: function(_endpoint) {
        return $.ajax({ url: this.baseURL + _endpoint + '.json' });
    },

    getBitcoinRatesForAll: function() {
        return this.fetch('all');
    },

    getBitcoinRatesForOneYear: function() {
        return this.fetch('year');
    },

    getBitcoinRatesForOneMonth: function() {
        return this.fetch('month');
    },

    getBitcoinRatesForOneWeek: function() {
        return this.fetch('week');
    },

    getBitcoinRatesForOneDay: function() {
        return this.fetch('day');
    },

    getBitcoinRatesForOneHour: function() {
        return this.fetch('hour');
    }
};

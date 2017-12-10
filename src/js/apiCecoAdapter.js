window.App = window.App || {};

window.App.apiCecoAdapter = {
    baseURL: 'https://api.crypto-tab.com/v1/',

    get: function(_endpoint) {
        return App.API.get(_endpoint);
    },

    mapData: function(response, dateLabelFormat) {
        return response.map( _rec => ({
            value: _rec.value,
            timestamp: moment(moment.utc(_rec.timestamp * 1000)).local().format(dateLabelFormat)
        })).reverse();
    },

    _createDateAsUTC: function(date) {
        return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
    },

    getBitcoinRatesForAll: function() {
        return this.get('bitcoin/all');
    },

    getBitcoinRatesForOneYear: function() {
        return this.get('bitcoin/year');
    },

    getBitcoinRatesForOneMonth: function() {
        return this.get('bitcoin/month');
    },

    getBitcoinRatesForOneWeek: function() {
        return this.get('bitcoin/week');
    },

    getBitcoinRatesForOneDay: function() {
        return this.get('bitcoin/day');
    },

    getBitcoinRatesForOneHour: function() {
      return this.get('bitcoin/hour');
    },

    getBitcoinRatesNow: function() {
      return this.get('bitcoin/now');
    }
};

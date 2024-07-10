window.App = window.App || {};

window.App.apiFakeAdapter = {
    baseURL: 'fake-api/',

    mapData: function (response, dateLabelFormat) {
        return response.map((_rec) => ({
            value: _rec.value,
            timestamp: dayjs(_rec.timestamp).format(dateLabelFormat),
        }));
    },

    get: function (_endpoint) {
        return App.API.get(_endpoint).then((r) => r.data);
    },

    getBitcoinRatesForAll: function () {
        return this.get('all.json');
    },

    getBitcoinRatesForOneYear: function () {
        return this.get('year.json');
    },

    getBitcoinRatesForOneMonth: function () {
        return this.get('month.json');
    },

    getBitcoinRatesForOneWeek: function () {
        return this.get('week.json');
    },

    getBitcoinRatesForOneDay: function () {
        return this.get('day.json');
    },

    getBitcoinRatesForOneHour: function () {
        return this.get('hour.json');
    },

    getBitcoinRatesNow: function () {
        return this.get('hour.json');
    },
};

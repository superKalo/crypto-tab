window.App = window.App || {};

window.App.apiCecoAdapter = {
    mapData: function (response, dateLabelFormat) {
        return response
            .map((_rec) => ({
                value: _rec.value,
                timestamp: dayjs
                    .utc(_rec.timestamp * 1000)
                    .local()
                    .format(dateLabelFormat),
            }))
            .reverse();
    },

    getBitcoinRatesForPeriod: function (period) {
        return new Promise((resolve, reject) => {
            window.browser.runtime.sendMessage(
                { type: 'getBitcoinPrice', period: period },
                (response) => {
                    if (response && !response.error) {
                        resolve(response.data);
                    } else {
                        reject(response.error || 'Failed to retrieve Bitcoin price data');
                    }
                }
            );
        });
    },

    getBitcoinRatesForAll: function () {
        return this.getBitcoinRatesForPeriod('ALL');
    },

    getBitcoinRatesForOneYear: function () {
        return this.getBitcoinRatesForPeriod('ONE_YEAR');
    },

    getBitcoinRatesForOneMonth: function () {
        return this.getBitcoinRatesForPeriod('ONE_MONTH');
    },

    getBitcoinRatesForOneWeek: function () {
        return this.getBitcoinRatesForPeriod('ONE_WEEK');
    },

    getBitcoinRatesForOneDay: function () {
        return this.getBitcoinRatesForPeriod('ONE_DAY');
    },

    getBitcoinRatesForOneHour: function () {
        return this.getBitcoinRatesForPeriod('ONE_HOUR');
    },

    getBitcoinRatesNow: function () {
        return this.getBitcoinRatesForPeriod('NOW');
    },
};

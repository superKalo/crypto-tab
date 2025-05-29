window.App.apiBoyoAdapter = {
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

    getCryptoRatesForPeriod: function (period, cryptoType) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(
                { type: 'getCryptoPrice', period: period, cryptoType: cryptoType },
                (response) => {
                    if (response && !response.error) {
                        resolve(response.data);
                    } else {
                        reject(response.error || `Failed to retrieve ${cryptoType} price data`);
                    }
                }
            );
        });
    },
};

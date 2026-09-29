window.App.apiBoyoAdapter = {
    mapData: function (response, dateLabelFormat) {
        if (!response || !Array.isArray(response)) {
            return [];
        }

        return response
            .map((_rec) => {
                const rawTs = _rec.timestamp !== undefined ? _rec.timestamp : _rec.time; // fallback
                if (!rawTs) return null;

                const timestampMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
                const formatted = dayjs.utc(timestampMs).local().format(dateLabelFormat);

                return {
                    value: _rec.value !== undefined ? _rec.value : _rec.average,
                    timestamp: formatted,
                };
            })
            .filter(Boolean)
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

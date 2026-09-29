window.App = window.App || {};

window.App.PriceApi = (function () {
    const API_BASE_URL = 'https://api.crypto-tab.com/v1';

    function validateRequest(period, cryptoType) {
        const endpointPath = App.CryptoTokens.getEndpointPath(cryptoType, period);

        if (!endpointPath) {
            throw new Error(`Unsupported price request: ${cryptoType}/${period}`);
        }

        return endpointPath;
    }

    function validateResponse(data, period) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('The price API returned no data');
        }

        const isFiniteNumber = (value) => Number.isFinite(Number(value));

        if (period === 'NOW') {
            const [{ value, changePercent }] = data;
            const isValidChange =
                changePercent &&
                ['dayAgo', 'weekAgo', 'monthAgo'].every((key) =>
                    isFiniteNumber(changePercent[key])
                );

            if (!isFiniteNumber(value) || !isValidChange) {
                throw new Error('The price API returned an invalid current-price payload');
            }
        } else {
            const hasInvalidRecord = data.some((record) => {
                const timestamp = record.timestamp ?? record.time;
                const value = record.value ?? record.average;

                return !isFiniteNumber(timestamp) || !isFiniteNumber(value);
            });

            if (hasInvalidRecord) {
                throw new Error('The price API returned an invalid chart payload');
            }
        }

        return data;
    }

    async function fetchDirectly(period, cryptoType) {
        const endpointPath = validateRequest(period, cryptoType);
        const response = await fetch(`${API_BASE_URL}/${endpointPath}`);

        if (!response.ok) {
            throw new Error(`The price API responded with HTTP ${response.status}`);
        }

        return validateResponse(await response.json(), period);
    }

    async function fetchFromExtension(period, cryptoType) {
        validateRequest(period, cryptoType);

        const response = await window.browser.runtime.sendMessage({
            type: 'getCryptoPrice',
            period,
            cryptoType,
        });

        if (!response || response.error) {
            throw new Error(response?.error || `Failed to retrieve ${cryptoType} price data`);
        }

        return validateResponse(response.data, period);
    }

    return {
        getPriceData(period, cryptoType) {
            return App.ENV.platform === 'EXTENSION'
                ? fetchFromExtension(period, cryptoType)
                : fetchDirectly(period, cryptoType);
        },
    };
})();

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

    function normalizeNumber(value) {
        if (
            (typeof value !== 'number' && typeof value !== 'string') ||
            (typeof value === 'string' && value.trim() === '')
        ) {
            return null;
        }

        const normalizedValue = Number(value);

        return Number.isFinite(normalizedValue) ? normalizedValue : null;
    }

    function normalizeResponse(data, period) {
        if (!Array.isArray(data) || data.length === 0) {
            throw new Error('The price API returned no data');
        }

        if (period === 'NOW') {
            const currentPrice = data[0];
            const value = normalizeNumber(currentPrice?.value);
            const changePercent = currentPrice?.changePercent;
            const normalizedChange = changePercent && {
                dayAgo: normalizeNumber(changePercent.dayAgo),
                weekAgo: normalizeNumber(changePercent.weekAgo),
                monthAgo: normalizeNumber(changePercent.monthAgo),
            };
            const isValidChange =
                normalizedChange &&
                Object.values(normalizedChange).every((value) => value !== null);

            if (value === null || !isValidChange) {
                throw new Error('The price API returned an invalid current-price payload');
            }

            return [{ value, changePercent: normalizedChange }];
        } else {
            return data.map((record) => {
                const timestamp = normalizeNumber(record?.timestamp ?? record?.time);
                const value = normalizeNumber(record?.value ?? record?.average);

                if (timestamp === null || value === null) {
                    throw new Error('The price API returned an invalid chart payload');
                }

                return { timestamp, value };
            });
        }
    }

    async function fetchDirectly(period, cryptoType) {
        const endpointPath = validateRequest(period, cryptoType);
        const response = await fetch(`${API_BASE_URL}/${endpointPath}`);

        if (!response.ok) {
            throw new Error(`The price API responded with HTTP ${response.status}`);
        }

        return normalizeResponse(await response.json(), period);
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

        return normalizeResponse(response.data, period);
    }

    return {
        getPriceData(period, cryptoType) {
            return App.ENV.platform === 'EXTENSION'
                ? fetchFromExtension(period, cryptoType)
                : fetchDirectly(period, cryptoType);
        },
    };
})();

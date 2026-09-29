if (typeof importScripts === 'function') {
    importScripts('cryptoTokens.js');
}

async function fetchCryptoPrice(period, cryptoType) {
    const endpointPath = globalThis.App.CryptoTokens.getEndpointPath(cryptoType, period);

    if (!endpointPath) {
        throw new Error(`Unsupported price request: ${cryptoType}/${period}`);
    }

    const response = await fetch(`https://api.crypto-tab.com/v1/${endpointPath}`);

    if (!response.ok) {
        throw new Error(`The price API responded with HTTP ${response.status}`);
    }

    return response.json();
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'getCryptoPrice') {
        const { period, cryptoType } = request;

        fetchCryptoPrice(period, cryptoType)
            .then((data) => sendResponse({ data }))
            .catch((error) => sendResponse({ error: error.message }));

        return true;
    }

    return false;
});

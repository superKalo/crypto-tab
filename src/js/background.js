let cryptoPriceData = {};

function initCryptoDataForToken(cryptoType) {
    if (!cryptoPriceData[cryptoType]) {
        cryptoPriceData[cryptoType] = {};
    }
}

async function fetchCryptoPrice(period, cryptoType) {
    initCryptoDataForToken(cryptoType);
    
    const endpoints = {
        ALL: `${cryptoType}/all`,
        ONE_YEAR: `${cryptoType}/year`,
        ONE_MONTH: `${cryptoType}/month`,
        ONE_WEEK: `${cryptoType}/week`,
        ONE_DAY: `${cryptoType}/day`,
        ONE_HOUR: `${cryptoType}/hour`,
        NOW: `${cryptoType}/now`,
    };

    try {
        const response = await fetch(`https://api.crypto-tab.com/v1/${endpoints[period]}`);
        const data = await response.json();
        cryptoPriceData[cryptoType][period] = data;
    } catch (error) {
        console.error(`Error fetching ${cryptoType} price for ${period}:`, error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getCryptoPrice') {
        const { period, cryptoType } = request;
        fetchCryptoPrice(period, cryptoType).then(() => {
            sendResponse({ data: cryptoPriceData[cryptoType][period], cached: false });
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});

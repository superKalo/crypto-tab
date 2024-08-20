let bitcoinPriceData = {};

async function fetchBitcoinPrice(period) {
    const endpoints = {
        ALL: 'bitcoin/all',
        ONE_YEAR: 'bitcoin/year',
        ONE_MONTH: 'bitcoin/month',
        ONE_WEEK: 'bitcoin/week',
        ONE_DAY: 'bitcoin/day',
        ONE_HOUR: 'bitcoin/hour',
        NOW: 'bitcoin/now',
    };

    try {
        const response = await fetch(`https://api.crypto-tab.com/v1/${endpoints[period]}`);
        const data = await response.json();
        bitcoinPriceData[period] = data;
    } catch (error) {
        console.error(`Error fetching Bitcoin price for ${period}:`, error);
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getBitcoinPrice') {
        const period = request.period;
        fetchBitcoinPrice(period).then(() => {
            sendResponse({ data: bitcoinPriceData[period], cached: false });
        });
        return true; // Indicates that the response will be sent asynchronously
    }
});

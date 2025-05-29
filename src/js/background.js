// Define `window` object with chrome ref, SuperRepo lib expects `window` being available
self.window = { chrome };
importScripts('../lib/index.js'); // SuperRepo lib

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

const PERIODS = {
    ONE_HOUR: 'ONE_HOUR',
    ONE_DAY: 'ONE_DAY',
    ONE_WEEK: 'ONE_WEEK',
    ONE_MONTH: 'ONE_MONTH',
    ONE_YEAR: 'ONE_YEAR',
    ALL: 'ALL',
};

const getLabelFormat = (period) => {
    switch (period) {
        case 'ALL':
            return 'YYYY';
        case 'ONE_YEAR':
            return 'MMM YYYY';
        case 'ONE_MONTH':
            return 'D MMM';
        case 'ONE_WEEK':
            return 'dddd';
        case 'ONE_DAY':
            return 'HH:mm';
        case 'ONE_HOUR':
            return 'HH:mm';
    }
};

const BitcoinRepositories = {};
Object.keys(PERIODS).forEach((period) => {
    BitcoinRepositories[period] = new SuperRepo({
        storage: 'BROWSER_STORAGE',
        name: 'bitcoin-' + period,
        outOfDateAfter: 15 * 60 * 1000, // 15 minutes
        mapData: (r) => App.API.mapData(r, getLabelFormat(period)),
        request: () => fetchBitcoinPrice(period),
    });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getBitcoinPrice') {
        const period = request.period;

        if (period === 'NOW') {
            fetchBitcoinPrice(period).then(() => {
                sendResponse({ data: bitcoinPriceData[period], cached: false });
            });
        } else {
            console.log(BitcoinRepositories);
            BitcoinRepositories[period].getData().then((data) => {
                console.log(`Sending Bitcoin price data for ${period} to the content script`);
                sendResponse({ data, cached: false });
            });
        }

        return true; // Indicates that the response will be sent asynchronously
    }
});

globalThis.App = globalThis.App || {};

globalThis.App.CryptoTokens = {
    TOKENS: {
        bitcoin: {
            id: 'bitcoin',
            displayName: 'Bitcoin',
            symbol: 'BTC',
            priceFractionDigits: 8,
            logoPath: 'img/tokens/bitcoin.svg',
            description: 'Peer-to-peer digital currency on the Bitcoin network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/bitcoin',
        },
        ethereum: {
            id: 'ethereum',
            displayName: 'Ether',
            symbol: 'ETH',
            priceFractionDigits: 0,
            logoPath: 'img/tokens/ethereum.svg',
            description: 'The native coin of the Ethereum network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/ethereum',
        },
        hedera: {
            id: 'hedera',
            displayName: 'HBAR',
            selectionName: 'Hedera',
            symbol: 'HBAR',
            priceFractionDigits: 4,
            logoPath: 'img/tokens/hedera.svg',
            description: 'HBAR, the native coin of the Hedera network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/hedera',
        },
        wallet: {
            id: 'wallet',
            displayName: 'WALLET',
            selectionName: 'Ambire Wallet',
            symbol: 'WALLET',
            priceFractionDigits: 5,
            logoPath: 'img/tokens/wallet.svg',
            description: 'The governance token of Ambire Wallet.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/ambire-wallet',
        },
    },

    PERIODS: {
        ONE_HOUR: 'ONE_HOUR',
        ONE_DAY: 'ONE_DAY',
        ONE_WEEK: 'ONE_WEEK',
        ONE_MONTH: 'ONE_MONTH',
        ONE_YEAR: 'ONE_YEAR',
        ALL: 'ALL',
    },

    PERIOD_PATHS: {
        ONE_HOUR: 'hour',
        ONE_DAY: 'day',
        ONE_WEEK: 'week',
        ONE_MONTH: 'month',
        ONE_YEAR: 'year',
        ALL: 'all',
        NOW: 'now',
    },

    getAllTokens() {
        return Object.values(this.TOKENS);
    },

    getToken(tokenId) {
        return this.TOKENS[tokenId] || null;
    },

    getDisplayName(tokenId) {
        const token = this.getToken(tokenId);
        return token ? token.displayName : tokenId;
    },

    getDefaultToken() {
        return 'bitcoin';
    },

    getDefaultPeriod() {
        return this.PERIODS.ONE_DAY;
    },

    isSupportedToken(tokenId) {
        return Boolean(this.getToken(tokenId));
    },

    isSupportedPeriod(period) {
        return Object.prototype.hasOwnProperty.call(this.PERIOD_PATHS, period);
    },

    isChartPeriod(period) {
        return Object.prototype.hasOwnProperty.call(this.PERIODS, period);
    },

    getEndpointPath(tokenId, period) {
        if (!this.isSupportedToken(tokenId) || !this.isSupportedPeriod(period)) {
            return null;
        }

        return `${tokenId}/${this.PERIOD_PATHS[period]}`;
    },
};

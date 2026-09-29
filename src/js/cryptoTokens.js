globalThis.App = globalThis.App || {};

globalThis.App.CryptoTokens = {
    TOKENS: {
        bitcoin: {
            id: 'bitcoin',
            displayName: 'Bitcoin',
        },
        ethereum: {
            id: 'ethereum',
            displayName: 'Ethereum',
        },
        hedera: {
            id: 'hedera',
            displayName: 'Hedera',
        },
        wallet: {
            id: 'wallet',
            displayName: 'Ambire Wallet',
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

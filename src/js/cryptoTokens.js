globalThis.App = globalThis.App || {};

globalThis.App.CryptoTokens = {
    TOKENS: {
        bitcoin: {
            id: 'bitcoin',
            displayName: 'Bitcoin',
            symbol: 'BTC',
            priceFractionDigits: 0,
            logoPath: 'img/tokens/bitcoin.svg',
            textColor: '#b85e00',
            darkTextColor: '#f7931a',
            description: 'Peer-to-peer digital currency on the Bitcoin network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/bitcoin',
        },
        ethereum: {
            id: 'ethereum',
            displayName: 'Ether',
            symbol: 'ETH',
            priceFractionDigits: 0,
            logoPath: 'img/tokens/ethereum.svg',
            textColor: '#62688f',
            darkTextColor: '#a3aed0',
            description: 'The native coin of the Ethereum network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/ethereum',
        },
        wallet: {
            id: 'wallet',
            displayName: 'WALLET',
            selectionName: 'Ambire Wallet',
            symbol: 'WALLET',
            priceFractionDigits: 5,
            logoPath: 'img/tokens/wallet.svg',
            textColor: '#6000ff',
            darkTextColor: '#ad80ff',
            description: 'The governance token of Ambire Wallet.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/ambire-wallet',
        },
        hedera: {
            id: 'hedera',
            displayName: 'HBAR',
            selectionName: 'Hedera',
            symbol: 'HBAR',
            priceFractionDigits: 4,
            logoPath: 'img/tokens/hedera.svg',
            textColor: '#222222',
            darkTextColor: '#f5f5f5',
            description: 'HBAR, the native coin of the Hedera network.',
            coinGeckoUrl: 'https://www.coingecko.com/en/coins/hedera',
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

    REFRESH_POLICIES: {
        NOW: {
            interval: 3 * 60 * 1000,
            alignToClock: false,
            description: 'Current price. Refreshes every 3 minutes.',
        },
        ONE_HOUR: {
            interval: 5 * 60 * 1000,
            alignToClock: true,
            description: '5-minute price samples. Refreshes on each 5-minute mark.',
        },
        ONE_DAY: {
            interval: 5 * 60 * 1000,
            alignToClock: true,
            description:
                'Hourly averages. The current hour is still changing, so data refreshes every 5 minutes.',
        },
        ONE_WEEK: {
            interval: 15 * 60 * 1000,
            alignToClock: true,
            description:
                "Daily averages. Today's average is still changing, so data refreshes every 15 minutes.",
        },
        ONE_MONTH: {
            interval: 15 * 60 * 1000,
            alignToClock: true,
            description:
                "Daily averages. Today's average is still changing, so data refreshes every 15 minutes.",
        },
        ONE_YEAR: {
            interval: 15 * 60 * 1000,
            alignToClock: true,
            description:
                "Monthly averages. This month's average is still changing, so data refreshes every 15 minutes.",
        },
        ALL: {
            interval: 15 * 60 * 1000,
            alignToClock: true,
            description:
                "Monthly averages. This month's average is still changing, so data refreshes every 15 minutes.",
        },
    },

    getRefreshPolicy(period) {
        return this.REFRESH_POLICIES[period] || null;
    },

    getNextRefreshAt(period, lastFetched) {
        const policy = this.getRefreshPolicy(period);

        if (!policy || !Number.isFinite(lastFetched) || lastFetched <= 0) {
            return null;
        }

        return policy.alignToClock
            ? (Math.floor(lastFetched / policy.interval) + 1) * policy.interval
            : lastFetched + policy.interval;
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

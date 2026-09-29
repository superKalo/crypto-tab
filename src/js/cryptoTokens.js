// Configuration for all supported crypto tokens
window.App = window.App || {};

window.App.CryptoTokens = {
    // Token configuration
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

    // Get all available tokens as an array
    getAllTokens() {
        return Object.values(this.TOKENS);
    },

    // Get token by ID
    getToken(tokenId) {
        return this.TOKENS[tokenId] || null;
    },

    // Get the display name for a token
    getDisplayName(tokenId) {
        const token = this.getToken(tokenId);
        return token ? token.displayName : tokenId;
    },

    // Get the default token ID
    getDefaultToken() {
        return 'bitcoin';
    },
};

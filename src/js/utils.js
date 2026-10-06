window.App = window.App || {};

window.App.Utils = (function () {
    const priceFormatters = new Map();

    return {
        formatPrice(price, tokenId) {
            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice)) {
                return '$—';
            }

            const fractionDigits = App.CryptoTokens.getToken(tokenId)?.priceFractionDigits ?? 8;

            if (!priceFormatters.has(fractionDigits)) {
                priceFormatters.set(
                    fractionDigits,
                    new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: fractionDigits,
                    })
                );
            }

            return priceFormatters.get(fractionDigits).format(numericPrice);
        },
    };
})();

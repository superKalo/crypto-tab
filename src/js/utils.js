window.App = window.App || {};

window.App.Utils = (function () {
    const priceFormatters = new Map();
    const percentFormatter = new Intl.NumberFormat('en-US', {
        style: 'percent',
        signDisplay: 'exceptZero',
        maximumFractionDigits: 10,
    });

    return {
        formatPrice(price, tokenId) {
            const numericPrice = Number(price);

            if (!Number.isFinite(numericPrice)) {
                return '$—';
            }

            const fractionDigits = Math.max(
                App.CryptoTokens.getToken(tokenId)?.priceFractionDigits ?? 8,
                numericPrice > 0 && numericPrice < 1 ? 2 : 0
            );
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

        formatPercent(value) {
            return percentFormatter.format(value / 100);
        },
    };
})();

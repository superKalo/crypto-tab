window.App = window.App || {};

window.App.Utils = (function () {
    const priceFormatters = new Map();
    const percentFormatters = new Map();

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
            const locale = App.I18n.locale;
            const formatterKey = `${locale}:${fractionDigits}`;

            if (!priceFormatters.has(formatterKey)) {
                priceFormatters.set(
                    formatterKey,
                    new Intl.NumberFormat(locale, {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: fractionDigits,
                    })
                );
            }

            return priceFormatters.get(formatterKey).format(numericPrice);
        },

        formatPercent(value) {
            const locale = App.I18n.locale;
            if (!percentFormatters.has(locale)) {
                percentFormatters.set(
                    locale,
                    new Intl.NumberFormat(locale, {
                        style: 'percent',
                        signDisplay: 'exceptZero',
                        maximumFractionDigits: 10,
                    })
                );
            }

            return percentFormatters.get(locale).format(value / 100);
        },
    };
})();

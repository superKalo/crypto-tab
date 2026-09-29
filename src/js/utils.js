window.App = window.App || {};

window.App.Utils = (function () {
    const priceFormatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 8,
    });

    return {
        formatPrice(price) {
            const numericPrice = Number(price);

            return Number.isFinite(numericPrice) ? priceFormatter.format(numericPrice) : '$—';
        },
    };
})();

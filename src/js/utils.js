window.App = window.App || {};

window.App.Utils = {
    /**
     * Beautify the price number.
     * https://stackoverflow.com/a/14467460/1333836
     */
    formatPrice(_p) {
        const price = _p.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");

        return `$${price}`;
    }
}

window.App = window.App || {};

window.App.Utils = {
    /**
     * Beautify the price number.
     * https://stackoverflow.com/a/14467460/1333836
     */
    formatPrice(_p) {
        const priceStr = _p.toString();
        
        // Split by decimal point
        const parts = priceStr.split('.');
        
        // Add commas only to the integer part (before decimal)
        const integerPart = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
        
        // Reconstruct with decimal part if it exists
        const price = parts.length > 1 ? `${integerPart}.${parts[1]}` : integerPart;

        return `$${price}`;
    }
}

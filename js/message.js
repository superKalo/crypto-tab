window.App = window.App || {};

window.App.Message = {
    loaderEl: document.getElementById('message'),

    fireError(text) {
        this.loaderEl.textContent = text;
    },

    clear() {
        this.loaderEl.textContent = '';
    }
};

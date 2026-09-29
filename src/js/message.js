window.App = window.App || {};

window.App.Message = {
    messageEl: document.getElementById('message'),

    fireError(text) {
        this.messageEl.textContent = text;
    },

    clear() {
        this.messageEl.textContent = '';
    },
};

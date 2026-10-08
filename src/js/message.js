window.App = window.App || {};

window.App.Message = {
    messageEl: document.getElementById('message'),

    show(text) {
        this.messageEl.textContent = text;
    },

    fireError(text) {
        this.show(text);
    },

    clear() {
        this.messageEl.textContent = '';
    },
};

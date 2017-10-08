window.App = window.App || {};

window.App.Loader = {
    loaderEl: document.getElementById('loader'),

    init() {
        this.loaderEl.classList.add('fade-in');
    },

    destroy() {
        this.loaderEl.classList.remove('fade-in');
    }
};

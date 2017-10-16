window.App = window.App || {};

window.App.Loader = {
    loaderEl: document.getElementById('loader'),
    page: document.querySelector('html'),

    init() {
        this.loaderEl.classList.add('fade-in');
    },

    destroy() {
        this.loaderEl.classList.remove('fade-in');
    },

    displayPage() {
        this.page.classList.add('fade-in');
    }
};

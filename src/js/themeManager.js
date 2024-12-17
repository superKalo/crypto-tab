window.App = window.App || {};

window.App.ThemeManager = (function () {
    let themeOptions;

    function init() {
        themeOptions = document.querySelectorAll('.toggle-option');

        const savedTheme = getSavedTheme();
        applyTheme(savedTheme);
        updateActiveOption(savedTheme);

        themeOptions.forEach((option) => {
            option.addEventListener('click', handleThemeToggle);
        });
    }

    function handleThemeToggle(event) {
        const selectedTheme = event.target.dataset.theme;

        updateActiveOption(selectedTheme);
        applyTheme(selectedTheme);

        saveTheme(selectedTheme);
    }

    function updateActiveOption(theme) {
        themeOptions.forEach((option) => option.classList.remove('active'));

        themeOptions.forEach((option) => {
            if (option.dataset.theme === theme) {
                option.classList.add('active');
            }
        });
    }

    function applyTheme(theme) {
        const body = document.body;
        if (theme === 'dark') {
            body.classList.add('dark-theme');
        } else {
            body.classList.remove('dark-theme');
        }
    }

    function getSavedTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    function saveTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    return {
        init,
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.App.ThemeManager.init();
});

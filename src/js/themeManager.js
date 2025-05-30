window.App = window.App || {};

window.App.ThemeManager = (function () {
    let themeOptions;

    async function init() {
        themeOptions = document.querySelectorAll('.toggle-option');

        const savedTheme = await getSavedTheme();
        applyTheme(savedTheme);
        updateActiveOption(savedTheme);

        themeOptions.forEach((option) => {
            option.addEventListener('click', handleThemeToggle);
        });

        listenToSystemThemeChange();
    }

    async function handleThemeToggle(event) {
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

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.setAttribute('data-active', theme);
        }
    }

    function applyTheme(theme) {
        const body = document.body;

        if (theme === 'system') {
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

            if (systemPrefersDark) {
                body.classList.add('dark-theme');
                body.classList.remove('light-theme');
            } else {
                body.classList.add('light-theme');
                body.classList.remove('dark-theme');
            }
        } else if (theme === 'dark') {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
        }
    }

    async function listenToSystemThemeChange() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', async () => {
            const savedTheme = await getSavedTheme();
            if (savedTheme === 'system') {
                applyTheme('system');
            }
        });
    }

    async function getSavedTheme() {
        const settings = await window.App.Settings.get();
        return settings.theme || 'system';
    }

    function saveTheme(theme) {
        window.App.Settings.set('theme', theme);
    }

    return {
        init,
        applyTheme,
    };
})();

window.App.ThemeManager.init();

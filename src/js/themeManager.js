window.App = window.App || {};

window.App.ThemeManager = (function () {
    let themeOptions = [];
    let currentTheme = 'light';
    let isInitialized = false;
    let themeChanged = false;

    function normalizeTheme(theme) {
        return ['light', 'system', 'dark'].includes(theme) ? theme : 'light';
    }

    async function init() {
        if (isInitialized) {
            return;
        }

        isInitialized = true;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (currentTheme === 'system') {
                notifyThemeChange();
            }
        });
        // Apply the default before styles load, then read the saved theme independently of charts.
        applyTheme(currentTheme);

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initControls, { once: true });
        } else {
            initControls();
        }
        window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('theme')) {
                themeChanged = true;
                const theme = normalizeTheme(settings.theme);
                applyTheme(theme);
            }
        });

        try {
            const settings = await window.App.Settings.get();
            if (!themeChanged) {
                const theme = normalizeTheme(settings.theme);
                applyTheme(theme);
            }
        } catch (error) {
            if (!themeChanged) {
                applyTheme('light');
            }
            console.warn('Unable to load the theme preference. Keeping the current theme.', error);
        }
    }

    function initControls() {
        themeOptions = document.querySelectorAll('input[name="theme"]');
        themeOptions.forEach((option) => {
            option.addEventListener('change', handleThemeToggle);
        });
        updateActiveOption(currentTheme);
    }

    function handleThemeToggle(event) {
        if (!event.target.checked) {
            return;
        }

        themeChanged = true;
        const selectedTheme = normalizeTheme(event.target.value);

        applyTheme(selectedTheme);

        window.App.Settings.set('theme', selectedTheme);
    }

    function updateActiveOption(theme) {
        themeOptions.forEach((option) => {
            option.checked = option.value === theme;
        });
    }

    function applyTheme(theme) {
        currentTheme = normalizeTheme(theme);
        document.documentElement.classList.toggle('dark-theme', currentTheme === 'dark');
        document.documentElement.classList.toggle('light-theme', currentTheme === 'light');
        updateActiveOption(currentTheme);
        // System mode inherits the live prefers-color-scheme CSS media query.
        notifyThemeChange();
    }

    function notifyThemeChange() {
        window.dispatchEvent(new Event('themechange'));
    }

    return {
        init,
        applyTheme,
    };
})();

window.App.ThemeManager.init();

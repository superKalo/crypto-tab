window.App = window.App || {};

window.App.ThemeManager = (function () {
    let themeOptions;
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
        themeOptions = document.querySelectorAll('input[name="theme"]');

        themeOptions.forEach((option) => {
            option.addEventListener('change', handleThemeToggle);
        });
        window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('theme')) {
                themeChanged = true;
                const theme = normalizeTheme(settings.theme);
                updateActiveOption(theme);
                applyTheme(theme);
            }
        });

        try {
            const settings = await window.App.Settings.get();
            if (!themeChanged) {
                const theme = normalizeTheme(settings.theme);
                updateActiveOption(theme);
                applyTheme(theme);
            }
        } catch (error) {
            if (!themeChanged) {
                applyTheme('light');
            }
            console.warn('Unable to load the theme preference. Keeping the current theme.', error);
        }
    }

    function handleThemeToggle(event) {
        if (!event.target.checked) {
            return;
        }

        themeChanged = true;
        const selectedTheme = normalizeTheme(event.target.value);

        updateActiveOption(selectedTheme);
        applyTheme(selectedTheme);

        window.App.Settings.set('theme', selectedTheme);
    }

    function updateActiveOption(theme) {
        themeOptions.forEach((option) => {
            option.checked = option.value === theme;
        });
    }

    function applyTheme(theme) {
        const selectedTheme = normalizeTheme(theme);
        document.body.classList.toggle('dark-theme', selectedTheme === 'dark');
        document.body.classList.toggle('light-theme', selectedTheme === 'light');
        // System mode inherits the live prefers-color-scheme CSS media query.
    }

    return {
        init,
        applyTheme,
    };
})();

window.App.ThemeManager.init();

window.App = window.App || {};

window.App.SettingsPanel = (function () {
    let settingsPanel;
    let toggleButton;
    let themeToggle;
    let themeOptions;

    const DEFAULT_UP_COLOR = '#61ca00';
    const DEFAULT_DOWN_COLOR = '#ff4949';

    function init() {
        settingsPanel = document.getElementById('settings-panel');
        toggleButton = document.getElementById('toggle-settings');
        themeToggle = document.getElementById('theme-toggle');
        themeOptions = document.querySelectorAll('.toggle-option');

        toggleButton.addEventListener('click', togglePanelVisibility);

        document.querySelectorAll('#close-settings').forEach((btn) => {
            btn.addEventListener('click', hidePanel);
        });

        themeOptions.forEach((option) => {
            option.addEventListener('click', handleThemeToggle);
        });

        document.getElementById('token-select').addEventListener('change', (e) => {
            window.App.Settings.set('token', e.target.value);
        });

        document.getElementById('clock-format').addEventListener('change', (e) => {
            const newFormat = e.target.value;
            window.App.Settings.set('clockFormat', newFormat);

            if (window.App.ClockInstance) {
                window.App.ClockInstance.updateFormat(newFormat);
            }
        });

        document.getElementById('color-up').addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--color-up', color);
            updateCircleColor('circle-up', color);
            updateBorderColor('border-up', color);
            window.App.Settings.set('colorup', color);
        });

        document.getElementById('color-down').addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--color-down', color);
            updateCircleColor('circle-down', color);
            updateBorderColor('border-down', color);
            window.App.Settings.set('colordown', color);
        });

        document.getElementById('reset-colors').addEventListener('click', () => {
            resetColors();
        });

        loadSettings();
    }

    function togglePanelVisibility() {
        settingsPanel.classList.toggle('hidden');
    }

    function hidePanel() {
        settingsPanel.classList.add('hidden');
    }

    function handleThemeToggle(event) {
        const selectedOption = event.target;

        themeOptions.forEach((option) => option.classList.remove('active'));
        selectedOption.classList.add('active');

        const theme = selectedOption.dataset.theme;

        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        themeToggle.setAttribute('data-active', theme);

        window.App.Settings.set('theme', theme);
    }

    function resetColors() {
        document.documentElement.style.setProperty('--color-up', DEFAULT_UP_COLOR);
        document.documentElement.style.setProperty('--color-down', DEFAULT_DOWN_COLOR);

        document.getElementById('color-up').value = DEFAULT_UP_COLOR;
        document.getElementById('color-down').value = DEFAULT_DOWN_COLOR;

        updateCircleColor('circle-up', DEFAULT_UP_COLOR);
        updateCircleColor('circle-down', DEFAULT_DOWN_COLOR);

        updateBorderColor('border-up', DEFAULT_UP_COLOR);
        updateBorderColor('border-down', DEFAULT_DOWN_COLOR);

        window.App.Settings.set('colorup', DEFAULT_UP_COLOR);
        window.App.Settings.set('colordown', DEFAULT_DOWN_COLOR);
    }

    async function loadSettings() {
        const settings = await window.App.Settings.get();

        const savedTheme = settings.theme || 'light';
        themeToggle.setAttribute('data-active', savedTheme);

        themeOptions.forEach((option) => {
            option.classList.toggle('active', option.dataset.theme === savedTheme);
        });

        window.App.ThemeManager.applyTheme(savedTheme);

        const upColor = settings.colorup || '#61ca00';
        const downColor = settings.colordown || '#ff4949';

        document.documentElement.style.setProperty('--color-up', upColor);
        document.documentElement.style.setProperty('--color-down', downColor);

        document.getElementById('color-up').value = upColor;
        document.getElementById('color-down').value = downColor;

        updateCircleColor('circle-up', upColor);
        updateCircleColor('circle-down', downColor);

        updateBorderColor('border-up', upColor);
        updateBorderColor('border-down', downColor);

        const token = settings.token;
        if (token) {
            document.getElementById('token-select').value = token;
        }

        const clockFormat = settings.clockFormat;
        if (clockFormat) {
            document.getElementById('clock-format').value = clockFormat;
        }
    }

    function updateCircleColor(circleId, color) {
        const circle = document.getElementById(circleId);
        if (circle) {
            circle.style.backgroundColor = color;
        }
    }

    function updateBorderColor(borderId, color) {
        const border = document.getElementById(borderId);
        if (border) {
            border.style.borderColor = color;
        }
    }

    return {
        init,
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.App.SettingsPanel.init();
});

window.App = window.App || {};

window.App.SettingsPanel = (function () {
    let settingsPanel;
    let toggleButton;
    let closeButton;
    let themeToggle;
    let themeOptions;
    let resetButton;

    const DEFAULT_UP_COLOR = '#61ca00';
    const DEFAULT_DOWN_COLOR = '#ff4949';

    function init() {
        settingsPanel = document.getElementById('settings-panel');
        toggleButton = document.getElementById('toggle-settings');
        closeButton = document.getElementById('close-settings');
        themeToggle = document.getElementById('theme-toggle');
        themeOptions = document.querySelectorAll('.toggle-option');
        resetButton = document.getElementById('reset-colors');

        toggleButton.addEventListener('click', togglePanelVisibility);
        closeButton.addEventListener('click', hidePanel);

        themeOptions.forEach((option) => {
            option.addEventListener('click', handleThemeToggle);
        });

        document.getElementById('token-select').addEventListener('change', (e) => {
            saveSetting('token', e.target.value);
        });

        document.getElementById('clock-format').addEventListener('change', (e) => {
            const newFormat = e.target.value;
            localStorage.setItem('clockFormat', newFormat);

            if (window.App.ClockInstance) {
                window.App.ClockInstance.updateFormat(newFormat);
            }
        });

        document.getElementById('color-up').addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--color-up', color);
            updateArrowColor('arrow-up', color);
            saveSetting('colorup', color);
            toggleResetButtonVisibility();
        });

        document.getElementById('color-down').addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--color-down', color);
            updateArrowColor('arrow-down', color);
            saveSetting('colordown', color);
            toggleResetButtonVisibility();
        });

        document.getElementById('reset-colors').addEventListener('click', () => {
            resetColors();
            toggleResetButtonVisibility();
        });

        loadSettings();
        toggleResetButtonVisibility();
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

        saveSetting('theme', theme);
    }

    function resetColors() {
        document.documentElement.style.setProperty('--color-up', DEFAULT_UP_COLOR);
        document.documentElement.style.setProperty('--color-down', DEFAULT_DOWN_COLOR);

        document.getElementById('color-up').value = DEFAULT_UP_COLOR;
        document.getElementById('color-down').value = DEFAULT_DOWN_COLOR;

        updateArrowColor('arrow-up', DEFAULT_UP_COLOR);
        updateArrowColor('arrow-down', DEFAULT_DOWN_COLOR);

        saveSetting('colorup', DEFAULT_UP_COLOR);
        saveSetting('colordown', DEFAULT_DOWN_COLOR);
    }

    function toggleResetButtonVisibility() {
        const upColor = document.getElementById('color-up').value;
        const downColor = document.getElementById('color-down').value;

        if (upColor !== DEFAULT_UP_COLOR || downColor !== DEFAULT_DOWN_COLOR) {
            resetButton.style.display = 'inline-block';
        } else {
            resetButton.style.display = 'none';
        }
    }

    function saveSetting(key, value) {
        localStorage.setItem(key, value);
    }

    function loadSettings() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        themeToggle.setAttribute('data-active', savedTheme);

        themeOptions.forEach((option) => {
            option.classList.toggle('active', option.dataset.theme === savedTheme);
        });

        window.App.ThemeManager.applyTheme(savedTheme);

        const upColor = localStorage.getItem('colorup') || '#61ca00';
        const downColor = localStorage.getItem('colordown') || '#ff4949';

        document.documentElement.style.setProperty('--color-up', upColor);
        document.documentElement.style.setProperty('--color-down', downColor);

        document.getElementById('color-up').value = upColor;
        document.getElementById('color-down').value = downColor;

        updateArrowColor('arrow-up', upColor);
        updateArrowColor('arrow-down', downColor);

        const token = localStorage.getItem('token');
        if (token) {
            document.getElementById('token-select').value = token;
        }

        const clockFormat = localStorage.getItem('clockFormat');
        if (clockFormat) {
            document.getElementById('clock-format').value = clockFormat;
        }
    }

    function updateArrowColor(arrowId, color) {
        const arrow = document.getElementById(arrowId);
        if (arrow) {
            arrow.style.fill = color;

            const path = arrow.querySelector('path');
            if (path) {
                path.setAttribute('fill', color);
            }
        }
    }

    return {
        init,
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.App.SettingsPanel.init();
});

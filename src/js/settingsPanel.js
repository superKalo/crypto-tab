window.App = window.App || {};

window.App.SettingsPanel = (function () {
    let settingsPanel;
    let toggleButton;
    let closeButton;
    let themeToggle;
    let themeOptions;

    function init() {
        settingsPanel = document.getElementById('settings-panel');
        toggleButton = document.getElementById('toggle-settings');
        closeButton = document.getElementById('close-settings');
        themeToggle = document.getElementById('theme-toggle');
        themeOptions = document.querySelectorAll('.toggle-option');

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
        });

        document.getElementById('color-down').addEventListener('input', (e) => {
            const color = e.target.value;
            document.documentElement.style.setProperty('--color-down', color);
            updateArrowColor('arrow-down', color);
            saveSetting('colordown', color);
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

        saveSetting('theme', theme);
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

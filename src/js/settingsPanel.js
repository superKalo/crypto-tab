window.App = window.App || {};

window.App.Settings = (function () {
    let settingsPanel;
    let toggleButton;
    let closeButton;

    function init() {
        settingsPanel = document.getElementById('settings-panel');
        toggleButton = document.getElementById('toggle-settings');
        closeButton = document.getElementById('close-settings');

        toggleButton.addEventListener('click', togglePanelVisibility);
        closeButton.addEventListener('click', hidePanel);

        document.getElementById('theme-select').addEventListener('change', handleSettingChange);
        document.getElementById('token-select').addEventListener('change', handleSettingChange);
        document.getElementById('clock-format').addEventListener('change', handleSettingChange);
        document.getElementById('color-up').addEventListener('input', handleSettingChange);
        document.getElementById('color-down').addEventListener('input', handleSettingChange);
    }

    function togglePanelVisibility() {
        settingsPanel.classList.toggle('hidden');
    }

    function hidePanel() {
        settingsPanel.classList.add('hidden');
    }

    function handleSettingChange(event) {
        const { id, value } = event.target;
        const settingKey = id.replace('-', '');
        saveSetting(settingKey, value);
    }

    function saveSetting(key, value) {
        localStorage.setItem(key, value);
    }

    return {
        init,
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.App.Settings.init();
});

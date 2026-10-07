window.App = window.App || {};

window.App.SettingsPanel = (function () {
    let settingsPanel;
    let toggleButton;
    let themeToggle;
    let themeOptions;
    let tokenPicker;
    let tokenSelect;
    let tokenPickerControl;

    const DEFAULT_UP_COLOR = '#61ca00';
    const DEFAULT_DOWN_COLOR = '#ff4949';

    function renderSelectedToken(tokenId) {
        const token = window.App.CryptoTokens.getToken(tokenId);

        if (!token || !tokenPickerControl) {
            return;
        }

        document
            .getElementById('selected-token')
            .replaceChildren(window.App.TokenPicker.createIdentity(token));
        tokenPickerControl.renderSelected(tokenId);
        document.getElementById('token-description').textContent = token.description;

        const link = document.getElementById('token-learn-more');
        link.href = token.coinGeckoUrl;
        link.setAttribute('aria-label', `Learn more about ${token.displayName}`);
    }

    function init() {
        settingsPanel = document.getElementById('settings-panel');
        toggleButton = document.getElementById('toggle-settings');
        themeToggle = document.getElementById('theme-toggle');
        themeOptions = document.querySelectorAll('.toggle-option');
        tokenPicker = document.getElementById('token-picker');
        tokenSelect = document.getElementById('token-select');

        tokenPickerControl = new window.App.TokenPicker({
            container: tokenPicker,
            trigger: tokenSelect,
            options: document.getElementById('token-options'),
            onSelect: (tokenId) => window.App.Crypto.changeCryptoType(tokenId),
        });
        renderSelectedToken(
            window.App.Crypto.currentCrypto || window.App.CryptoTokens.getDefaultToken()
        );

        toggleButton.addEventListener('click', togglePanelVisibility);

        document.querySelectorAll('#close-settings').forEach((btn) => {
            btn.addEventListener('click', () => hidePanel(true));
        });

        themeOptions.forEach((option) => {
            option.addEventListener('click', handleThemeToggle);
        });

        tokenPicker.addEventListener('toggle', () => {
            document.getElementById('appearance-settings').hidden = tokenPicker.open;
        });
        settingsPanel.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();

                hidePanel(true);
            }
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

        // Close settings panel when clicking outside of it
        document.addEventListener('click', handleOutsideClick);

        loadSettings();
    }

    function togglePanelVisibility() {
        if (settingsPanel.classList.contains('hidden')) {
            settingsPanel.classList.remove('hidden');
            toggleButton.setAttribute('aria-expanded', 'true');
            tokenSelect.focus();
        } else {
            hidePanel();
        }
    }

    function hidePanel(restoreFocus = false) {
        settingsPanel.classList.add('hidden');
        toggleButton.setAttribute('aria-expanded', 'false');
        tokenPicker.open = false;

        if (restoreFocus) {
            toggleButton.focus();
        }
    }

    function handleOutsideClick(event) {
        // Don't close if the panel is already hidden
        if (settingsPanel.classList.contains('hidden')) {
            return;
        }

        // Don't close if clicking on the toggle button or inside the settings panel
        if (toggleButton.contains(event.target) || settingsPanel.contains(event.target)) {
            return;
        }

        // Close the panel
        hidePanel();
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

        window.App.Settings.setMultiple({
            colorup: DEFAULT_UP_COLOR,
            colordown: DEFAULT_DOWN_COLOR,
        });
    }

    async function loadSettings() {
        const settings = await window.App.Settings.get();

        const savedTheme = settings.theme || 'light';
        themeToggle.setAttribute('data-active', savedTheme);

        themeOptions.forEach((option) => {
            option.classList.toggle('active', option.dataset.theme === savedTheme);
        });

        window.App.ThemeManager.applyTheme(savedTheme);

        const upColor = settings.colorup || DEFAULT_UP_COLOR;
        const downColor = settings.colordown || DEFAULT_DOWN_COLOR;

        document.documentElement.style.setProperty('--color-up', upColor);
        document.documentElement.style.setProperty('--color-down', downColor);

        document.getElementById('color-up').value = upColor;
        document.getElementById('color-down').value = downColor;

        updateCircleColor('circle-up', upColor);
        updateCircleColor('circle-down', downColor);

        updateBorderColor('border-up', upColor);
        updateBorderColor('border-down', downColor);

        const cryptoType = window.App.CryptoTokens.isSupportedToken(settings.cryptoType)
            ? settings.cryptoType
            : window.App.CryptoTokens.getDefaultToken();
        renderSelectedToken(window.App.Crypto.currentCrypto || cryptoType);

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
        renderSelectedToken,
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    window.App.SettingsPanel.init();
});

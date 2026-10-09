window.App = window.App || {};

window.App.SettingsPanel = (function () {
    let settingsPanel;
    let toggleButton;
    let tokenPicker;
    let tokenSelect;
    let tokenPickerControl;
    let aboutDialog;
    let aboutButton;
    const changedPreferences = new Set();

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
        tokenPicker = document.getElementById('token-picker');
        tokenSelect = document.getElementById('token-select');
        aboutDialog = document.getElementById('about-dialog');
        aboutButton = document.getElementById('open-about');

        tokenPickerControl = new window.App.TokenPicker({
            container: tokenPicker,
            trigger: tokenSelect,
            options: document.getElementById('token-options'),
            onSelect: (tokenId) => window.App.Crypto.changeCryptoType(tokenId),
            onOpen: () => window.App.TokenPickerIntro.dismiss(),
        });
        renderSelectedToken(
            window.App.Crypto.currentCrypto || window.App.CryptoTokens.getDefaultToken()
        );

        toggleButton.addEventListener('click', togglePanelVisibility);
        aboutButton.addEventListener('click', showAbout);
        document.getElementById('close-about').addEventListener('click', () => aboutDialog.close());
        aboutDialog.addEventListener('close', () => {
            document.body.classList.remove('about-open');
            aboutButton.focus();
        });
        aboutDialog.addEventListener('click', (event) => {
            if (event.target !== aboutDialog) {
                return;
            }

            const bounds = aboutDialog.getBoundingClientRect();
            if (
                event.clientX < bounds.left ||
                event.clientX > bounds.right ||
                event.clientY < bounds.top ||
                event.clientY > bounds.bottom
            ) {
                aboutDialog.close();
            }
        });

        document.querySelectorAll('#close-settings').forEach((btn) => {
            btn.addEventListener('click', () => hidePanel(true));
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
            if (!e.target.checked) {
                return;
            }

            changedPreferences.add('clockFormat');
            const newFormat = window.App.Clock.normalizeFormat(e.target.value);
            window.App.Settings.set('clockFormat', newFormat);
            window.App.Clock.updateFormat(newFormat);
        });

        document.getElementById('color-up').addEventListener('input', (e) => {
            const color = e.target.value;
            changedPreferences.add('colorup');
            applyColor('up', color);
            window.App.Settings.set('colorup', color);
        });

        document.getElementById('color-down').addEventListener('input', (e) => {
            const color = e.target.value;
            changedPreferences.add('colordown');
            applyColor('down', color);
            window.App.Settings.set('colordown', color);
        });

        document.getElementById('reset-colors').addEventListener('click', () => {
            resetColors();
        });

        // Close settings panel when clicking outside of it
        document.addEventListener('click', handleOutsideClick);

        window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('clockFormat')) {
                changedPreferences.add('clockFormat');
                renderClockFormat(settings.clockFormat);
            }
            ['up', 'down'].forEach((direction) => {
                const key = `color${direction}`;
                if (changedKeys.includes(key)) {
                    changedPreferences.add(key);
                    applyColor(direction, settings[key]);
                }
            });
        });
        loadSettings();
    }

    function togglePanelVisibility() {
        if (settingsPanel.classList.contains('hidden')) {
            showPanel();
        } else {
            hidePanel();
        }
    }

    function showPanel() {
        settingsPanel.classList.remove('hidden');
        toggleButton.setAttribute('aria-expanded', 'true');
        tokenSelect.focus();
    }

    function showAbout() {
        hidePanel();
        document.body.classList.add('about-open');
        aboutDialog.showModal();
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

    function resetColors() {
        changedPreferences.add('colorup');
        changedPreferences.add('colordown');
        applyColor('up', DEFAULT_UP_COLOR);
        applyColor('down', DEFAULT_DOWN_COLOR);

        window.App.Settings.setMultiple({
            colorup: DEFAULT_UP_COLOR,
            colordown: DEFAULT_DOWN_COLOR,
        });
    }

    async function loadSettings() {
        try {
            const settings = await window.App.Settings.get();

            ['up', 'down'].forEach((direction) => {
                const key = `color${direction}`;
                if (!changedPreferences.has(key)) {
                    applyColor(direction, settings[key]);
                }
            });

            const cryptoType = window.App.CryptoTokens.isSupportedToken(settings.cryptoType)
                ? settings.cryptoType
                : window.App.CryptoTokens.getDefaultToken();
            renderSelectedToken(window.App.Crypto.currentCrypto || cryptoType);

            if (!changedPreferences.has('clockFormat')) {
                renderClockFormat(settings.clockFormat);
            }
        } catch (error) {
            console.warn('Unable to load preferences. Keeping the current appearance.', error);
        }
    }

    function renderClockFormat(value) {
        const format = window.App.Clock.normalizeFormat(value);
        document.querySelectorAll('input[name="clockFormat"]').forEach((option) => {
            option.checked = option.value === format;
        });
    }

    function applyColor(direction, value) {
        const fallback = direction === 'up' ? DEFAULT_UP_COLOR : DEFAULT_DOWN_COLOR;
        const color = /^#[\da-f]{6}$/i.test(value) ? value : fallback;
        document.documentElement.style.setProperty(`--color-${direction}`, color);
        document.getElementById(`color-${direction}`).value = color;
        updateCircleColor(`circle-${direction}`, color);
        updateBorderColor(`border-${direction}`, color);
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

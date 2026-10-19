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

    // Keep the stored default as a marker for the theme's positive color.
    const DEFAULT_UP_COLOR = '#61ca00';
    const DEFAULT_DOWN_COLOR = '#ff4949';
    let currentUpColor = DEFAULT_UP_COLOR;

    function renderSelectedToken(tokenId) {
        const token = window.App.CryptoTokens.getToken(tokenId);

        if (!token || !tokenPickerControl) {
            return;
        }

        document
            .getElementById('selected-token')
            .replaceChildren(window.App.TokenPicker.createIdentity(token));
        tokenPickerControl.renderSelected(tokenId);
        document.getElementById('token-description').textContent = App.I18n.t(
            `token.description.${tokenId}`
        );

        const link = document.getElementById('token-coingecko-link');
        link.href = token.coinGeckoUrl;
        const linkLabel = App.I18n.t('token.viewOnCoinGecko', {
            token: token.selectionName || token.displayName,
        });
        link.setAttribute('aria-label', linkLabel);
        link.title = linkLabel;
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

        const languageSelect = document.getElementById('language-select');
        const languageBrowserDefault = document.getElementById('language-browser-default');
        const languageUseBrowser = document.getElementById('language-use-browser');

        function renderLanguagePreference() {
            const followsBrowser = App.I18n.preference === 'system';
            languageSelect.value = App.I18n.locale;
            languageBrowserDefault.hidden = !followsBrowser;
            languageUseBrowser.hidden = followsBrowser;
            if (followsBrowser) {
                languageSelect.setAttribute('aria-describedby', languageBrowserDefault.id);
            } else {
                languageSelect.removeAttribute('aria-describedby');
            }
        }

        async function saveLanguagePreference(preference, control) {
            if (languageSelect.disabled) {
                return;
            }
            const language = App.I18n.normalizePreference(preference);
            languageSelect.disabled = true;
            languageUseBrowser.disabled = true;
            const saved = await App.Settings.set('language', language);
            if (saved) {
                App.I18n.reload();
            } else {
                renderLanguagePreference();
                languageSelect.disabled = false;
                languageUseBrowser.disabled = false;
                control.focus();
                App.Message.fireError(App.I18n.t('errors.languageSave'));
            }
        }

        renderLanguagePreference();
        document.querySelectorAll('.price-color-preview').forEach((preview, index) => {
            preview.textContent = App.Utils.formatPercent(index === 0 ? 2.5 : -2.5);
        });
        languageSelect.addEventListener('change', () => {
            saveLanguagePreference(languageSelect.value, languageSelect);
        });
        languageUseBrowser.addEventListener('click', () => {
            saveLanguagePreference('system', languageUseBrowser);
        });

        ['up', 'down'].forEach((direction) => {
            const input = document.getElementById(`color-${direction}`);
            input.addEventListener('input', (event) => {
                changePriceColor(direction, event.target.value);
            });
            document.getElementById(`reset-${direction}-color`).addEventListener('click', () => {
                changePriceColor(
                    direction,
                    direction === 'up' ? DEFAULT_UP_COLOR : DEFAULT_DOWN_COLOR
                );
                input.focus();
            });
        });

        document.getElementById('color-accent').addEventListener('input', (event) => {
            changeAccentColor(event.target.value);
        });
        document.getElementById('reset-accent-color').addEventListener('click', () => {
            changeAccentColor(null);
            document.getElementById('color-accent').focus();
        });

        // Close settings panel when clicking outside of it
        document.addEventListener('click', handleOutsideClick);

        window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('clockFormat')) {
                changedPreferences.add('clockFormat');
                renderClockFormat(settings.clockFormat);
            }
            if (changedKeys.includes('accentColor')) {
                changedPreferences.add('accentColor');
                renderAccentColor(settings.accentColor);
            }
            ['up', 'down'].forEach((direction) => {
                const key = `color${direction}`;
                if (changedKeys.includes(key)) {
                    changedPreferences.add(key);
                    applyColor(direction, settings[key]);
                }
            });
        });
        window.addEventListener('themechange', () => applyColor('up', currentUpColor));
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

    function changePriceColor(direction, color) {
        const key = `color${direction}`;
        if (direction === 'up' && color.toLowerCase() === getDefaultPriceColor(direction)) {
            color = DEFAULT_UP_COLOR;
        }
        changedPreferences.add(key);
        applyColor(direction, color);
        window.App.Settings.set(key, color);
    }

    function getDefaultPriceColor(direction) {
        return direction === 'up'
            ? getComputedStyle(document.documentElement)
                  .getPropertyValue('--positive-color')
                  .trim()
                  .toLowerCase()
            : DEFAULT_DOWN_COLOR;
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
            if (!changedPreferences.has('accentColor')) {
                renderAccentColor(settings.accentColor);
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

    function renderAccentColor(value) {
        const color = window.App.AccentColor.normalize(value);
        document.getElementById('color-accent').value =
            color || window.App.AccentColor.DEFAULT_COLOR;
        document.getElementById('reset-accent-color').hidden = color === null;
    }

    function changeAccentColor(value) {
        const color = window.App.AccentColor.normalize(value);
        changedPreferences.add('accentColor');
        window.App.AccentColor.apply(color);
        renderAccentColor(color);
        window.App.Settings.set('accentColor', color);
    }

    function applyColor(direction, value) {
        const fallback = direction === 'up' ? DEFAULT_UP_COLOR : DEFAULT_DOWN_COLOR;
        const color = /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : fallback;
        const usesThemeColor = direction === 'up' && color === DEFAULT_UP_COLOR;
        const root = document.documentElement;

        if (direction === 'up') {
            currentUpColor = color;
        }

        if (usesThemeColor) {
            root.style.removeProperty('--color-up');
        } else {
            root.style.setProperty(`--color-${direction}`, color);
        }

        const defaultColor = getDefaultPriceColor(direction);
        const displayedColor = usesThemeColor ? defaultColor : color;
        document.getElementById(`color-${direction}`).value = displayedColor;
        document.getElementById(`reset-${direction}-color`).hidden =
            displayedColor === defaultColor;
    }

    return {
        init,
        renderSelectedToken,
    };
})();

App.I18n.ready.then(() => {
    window.App.SettingsPanel.init();
});

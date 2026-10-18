window.App = window.App || {};

window.App.AccentColor = (function () {
    const DEFAULT_COLOR = '#4f78e2';
    let currentColor = null;
    let preferenceChanged = false;

    function normalize(value) {
        const color =
            typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : null;
        return color === DEFAULT_COLOR ? null : color;
    }

    function mix(color, target, amount) {
        return color.map((channel, index) =>
            Math.round(channel + (target[index] - channel) * amount)
        );
    }

    function luminance(color) {
        const channels = color.map((channel) => {
            const value = channel / 255;
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        });

        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    function contrast(color, background) {
        const values = [luminance(color), luminance(background)].sort((a, b) => b - a);
        return (values[0] + 0.05) / (values[1] + 0.05);
    }

    function ensureContrast(color, background, minimum) {
        const target = luminance(background) > 0.5 ? [0, 0, 0] : [255, 255, 255];

        for (let step = 0; step <= 100; step += 1) {
            const candidate = mix(color, target, step / 100);
            if (contrast(candidate, background) >= minimum) {
                return candidate;
            }
        }

        return target;
    }

    function toHex(color) {
        return `#${color.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
    }

    function createPalette(color, background) {
        const accent = ensureContrast(color, background, 4.5);
        const selectedBackground = mix(accent, background, 0.9);
        const foreground =
            contrast(accent, [255, 255, 255]) >= contrast(accent, [0, 0, 0])
                ? '#ffffff'
                : '#000000';

        return {
            'accent-color': toHex(accent),
            'accent-text-color': foreground,
            'chart-line-color': toHex(ensureContrast(mix(accent, background, 0.4), background, 3)),
            'chart-point-color': toHex(accent),
            'tooltip-bg': toHex(accent),
            'tooltip-text-color': foreground,
            'token-selected-bg': toHex(selectedBackground),
            'token-selected-border': toHex(ensureContrast(accent, selectedBackground, 3)),
            'token-selected-text': toHex(ensureContrast(accent, selectedBackground, 4.5)),
        };
    }

    function apply(value) {
        preferenceChanged = true;
        const color = normalize(value);
        if (color === currentColor) {
            return;
        }

        currentColor = color;
        const root = document.documentElement;
        const rgb = (color || DEFAULT_COLOR)
            .slice(1)
            .match(/../g)
            .map((part) => parseInt(part, 16));

        // Override theme tokens so System mode can follow CSS media queries without a repaint race.
        Object.entries({ light: [255, 255, 255], dark: [18, 18, 18] }).forEach(
            ([theme, background]) => {
                Object.entries(createPalette(rgb, background)).forEach(([name, shade]) => {
                    const property = `--${theme}-${name}`;
                    if (color) {
                        root.style.setProperty(property, shade);
                    } else {
                        root.style.removeProperty(property);
                    }
                });
            }
        );

        if (color) {
            root.style.setProperty('--accent-input-color', color);
            root.style.setProperty('--accent-tooltip-bg', 'var(--tooltip-bg)');
        } else {
            root.style.removeProperty('--accent-input-color');
            root.style.removeProperty('--accent-tooltip-bg');
        }
        window.dispatchEvent(new Event('themechange'));
    }

    async function init() {
        window.App.Settings.subscribe((settings, changedKeys) => {
            if (changedKeys.includes('accentColor')) {
                apply(settings.accentColor);
            }
        });

        try {
            const settings = await window.App.Settings.get();
            if (!preferenceChanged) {
                apply(settings.accentColor);
            }
        } catch (error) {
            console.warn('Unable to load the accent color. Keeping the current palette.', error);
        }
    }

    return { DEFAULT_COLOR, normalize, apply, init };
})();

window.App.AccentColor.init();

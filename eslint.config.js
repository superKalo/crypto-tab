/* eslint-disable no-undef */
const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
    { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                axios: 'readonly',
                App: 'writable',
                moment: 'readonly',
                SuperRepo: 'readonly',
                Chart: 'readonly',
            },
        },
    },
    pluginJs.configs.recommended,
];

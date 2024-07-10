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
                SuperRepo: 'readonly',
                Chart: 'readonly',
                dayjs: 'readonly',
            },
        },
    },
    pluginJs.configs.recommended,
];

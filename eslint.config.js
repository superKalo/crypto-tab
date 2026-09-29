/* eslint-disable no-undef */
const globals = require('globals');
const pluginJs = require('@eslint/js');

module.exports = [
    { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
    {
        files: ['src/js/*.js'],
        languageOptions: {
            globals: {
                ...globals.browser,
                App: 'writable',
                SuperRepo: 'readonly',
                Chart: 'readonly',
                dayjs: 'readonly',
                chrome: 'readonly',
                importScripts: 'readonly',
            },
        },
    },
    {
        files: ['gulpfile.js'],
        languageOptions: {
            globals: globals.node,
        },
    },
    pluginJs.configs.recommended,
];

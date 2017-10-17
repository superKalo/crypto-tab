# Crypto Tab

A browser extension that replaces the New Tab page with Bitcoin price chart.

## Installation Instructions

This guide assumes you already have the project pulled and NodeJS and NPM are installed.

1. Install NPM dependencies:
    ```bash
    npm install
    ```

1. Install NPM dependencies:
    ```bash
    npm run build:extension
    ```

1. Load the extension:

    - In Chrome:
        - Navigate to chrome://extensions
        - Select "Developer Mode" and then click "Load unpacked extension..."
        - From the file browser, choose the `dist/extension/` directory

    - In Firefox:
        - Navigate to `about:debugging`
        - Click "Load Temporary Add-on" and from the file browser, choose the `manifest.json` file in the `dist/extension/` directory

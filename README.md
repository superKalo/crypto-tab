# <img src="https://user-images.githubusercontent.com/2548061/31789747-cc1d44ae-b51b-11e7-81a0-0a4ef84244ff.png" height="24" alt="Crypto Tab Logo" /> Crypto Tab

A browser extension that replaces the New Tab page with Bitcoin price chart.

## Installation Instructions

This guide assumes you already have the project pulled and NodeJS and NPM are installed.

1. Install NPM dependencies:
    ```bash
    npm install
    ```

1. Build extension distribution files:
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

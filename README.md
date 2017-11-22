# <img src="https://user-images.githubusercontent.com/2548061/31789747-cc1d44ae-b51b-11e7-81a0-0a4ef84244ff.png" height="24" alt="Crypto Tab Logo" /> Crypto Tab

A browser extension that replaces the New Tab page with this Bitcoin price chart:

<img src="https://i.imgur.com/E0N5eM0.gif" alt="Crypto Tab preview" width="526" height="381" />

## 📦 Install

- Google Chrome: [Available on Chrome Store](https://chrome.google.com/webstore/detail/crypto-tab/hmbkmkdhhlgemdgeefnhfaffdpddohpa).
- Mozilla Firefox: [Available on Firefox Add-ons (AMO)](https://addons.mozilla.org/en-US/firefox/addon/crypto-tab/).

## 👍 Contributing

I'm open to ideas and suggestions! If you want to contribute or simply you've caught a bug - you can either open an issue or clone the repository, and fire a Pull Request.

Its a **single code base** website and new tab (cross-)browser extension.

To install the project, first make sure you have NodeJS and NPM installed. Preferably, the latest versions, but anything not extremely old should work too. Then, simply run `npm install`. Then:

1. To build the extension distribution files, run:
    ```bash
    npm run build:extension
    ```

1. To build the extension distribution files and re-build (watch) in case of changes, run:
    ```bash
    npm run build:extension:watch
    ```

1. To build the website distribution files, run:
    ```bash
    npm run build:website
    ```

1. To build the website distribution files and re-build (watch) in case of changes, run:
    ```bash
    npm run build:extension:watch
    ```

Finally, load the extension:

- In Chrome:
    - Navigate to chrome://extensions
    - Select "Developer Mode" and then click "Load unpacked extension..."
    - From the file browser, choose the `dist/extension/` directory

- In Firefox:
    - Navigate to `about:debugging`
    - Click "Load Temporary Add-on" and from the file browser, choose the `manifest.json` file in the `dist/extension/` directory

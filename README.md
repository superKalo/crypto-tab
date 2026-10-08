<h1 align="center"><a href="https://crypto-tab.com"><img src="https://user-images.githubusercontent.com/2548061/31789747-cc1d44ae-b51b-11e7-81a0-0a4ef84244ff.png" height="70" width="70" alt="Crypto Tab Logo" /></a><br />Crypto Tab</h1>

<p align="center">Live crypto prices, every new tab.</p>

Crypto Tab replaces your browser's New Tab page with cryptocurrency price charts and a clock.
Free and open source, with light and dark themes.

## Install Crypto Tab

| Google Chrome                                                                                             | Mozilla Firefox                                                                  |
| --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| [**Add to Chrome**](https://chromewebstore.google.com/detail/crypto-tab/hmbkmkdhhlgemdgeefnhfaffdpddohpa) | [**Add to Firefox**](https://addons.mozilla.org/en-US/firefox/addon/crypto-tab/) |

Install from your browser's store, confirm the installation, and open a new tab to get started.

[**Try it in your browser**](https://crypto-tab.com) · [**Report a bug**](https://github.com/superKalo/crypto-tab/issues/new?template=bug-report.yml)

<p align="center">
    <a href="https://crypto-tab.com">
        <img src="https://i.imgur.com/E0N5eM0.gif" alt="Crypto Tab preview" width="526" height="381" />
    </a>
</p>

## Features

-   Follow Bitcoin (BTC), Ether (ETH), Ambire Wallet (WALLET), and Hedera (HBAR), with prices in USD.
-   Explore charts for the past hour, day, week, month, year, or all time.
-   Choose a light, dark, or system theme and customize price colors.
-   Switch between a 12-hour and 24-hour clock.
-   Keep your selected token, chart period, and preferences between tabs.

## Report a bug or request a token

[**Report a bug on GitHub**](https://github.com/superKalo/crypto-tab/issues/new?template=bug-report.yml).
Include your browser, whether you're using the extension or website, and steps to reproduce the problem.
Screenshots help too.

Missing a token? [Request it here](https://github.com/superKalo/crypto-tab/issues/new?template=request-token.yml).
For other ideas, [open an issue](https://github.com/superKalo/crypto-tab/issues).

## Contributing

Ideas, fixes, and pull requests are welcome. Crypto Tab uses one codebase for the website and browser
extensions, built with vanilla JavaScript.

<details>
<summary><strong>Build and run locally</strong></summary>

Use **Node.js 22 or newer** and npm. Clone this repository, then install dependencies:

```bash
npm install
```

Build the target you want to work on:

| Target                      | Build command                    | Output                   |
| --------------------------- | -------------------------------- | ------------------------ |
| Chrome / Chromium extension | `npm run build:extension:webkit` | `dist/extension-webkit/` |
| Firefox extension           | `npm run build:extension:gecko`  | `dist/extension-gecko/`  |
| Website                     | `npm run build:website`          | `dist/website/`          |

To rebuild automatically when source files change:

```bash
npm run build:extension:watch:webkit
npm run build:extension:watch:gecko
npm run build:website:watch
```

Load a local extension build:

-   **Chrome:** Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select
    `dist/extension-webkit/`.
-   **Firefox:** Open `about:debugging`, select **This Firefox**, click **Load Temporary Add-on**, and select
    `dist/extension-gecko/manifest.json`. This installation lasts until Firefox restarts.

Open a new tab to see Crypto Tab. After rebuilding, reload the extension and open a fresh tab.
For the website, serve `dist/website/` with a local static web server.

Edit files in `src/`; the generated `dist/` directories are replaced on each build.

</details>

## License

Code and documentation are released under the [GPL-3.0 License](LICENSE).

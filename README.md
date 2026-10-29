<h1 align="center"><a href="https://crypto-tab.com"><img src="src/img/logo.svg" height="70" width="70" alt="Crypto Tab Logo" /></a><br />Crypto Tab</h1>

<p align="center">Crypto Tab is a browser extension that replaces your New Tab page with cryptocurrency prices, charts, and a clock. It's open source, free, lightweight, and comes with light and dark themes.</p>

<p align="center">
    <a href="https://crypto-tab.com">
        <img src="src/mockups/social/crypto-tab-social-preview.jpg" alt="Crypto Tab showing cryptocurrency prices and a chart on a laptop" width="100%" />
    </a>
</p>

<p align="center">
    <a href="https://chromewebstore.google.com/detail/crypto-tab/hmbkmkdhhlgemdgeefnhfaffdpddohpa"><strong>Add to Chrome (or other Chromium browsers)</strong></a>
    &nbsp;·&nbsp;
    <a href="https://addons.mozilla.org/en-US/firefox/addon/crypto-tab/"><strong>Add to Firefox</strong></a><br />
    ...or <a href="https://crypto-tab.com">preview it</a> as a web version 👀
</p>

## Features

-   Choose Bitcoin (BTC), Ether (ETH), BNB, XRP, Solana (SOL), Dogecoin (DOGE), Hedera (HBAR),
    or Ambire Wallet (WALLET) to see its price in USD.
-   View the past hour, day, week, month, year, or all available history in a single chart.
-   Follow your system theme by default, or choose light or dark.
-   Customize the chart and interface accent color, with separate colors for price changes.
-   Follow your browser's regional clock format by default, or choose 12-hour or 24-hour time.
-   Available in Indonesian, German, English, Spanish, French, Italian, Polish, Brazilian and
    European Portuguese, Slovenian, Bulgarian, Serbian, and Japanese. The interface follows your
    browser language by default, with a language selector in Customize.
-   Pick up where you left off with your selected token, chart period, and preferences saved locally.

Prices update automatically while Crypto Tab is visible. Preference changes are shared between open
Crypto Tab tabs in the same browser profile.

## Privacy

The extension works without an account. It stores preferences and cached prices locally and fetches
market prices from the Crypto Tab API. Read the [Privacy Policy](https://crypto-tab.com/privacy/) for
details about extension permissions, price requests, and server logs.

## Report a bug or request a token

[**Report a bug on GitHub**](https://github.com/superKalo/crypto-tab/issues/new?template=bug-report.yml).
Include your browser, whether you're using the extension or website, and steps to reproduce the problem.
Screenshots help too.

Missing a token? [Request it here](https://github.com/superKalo/crypto-tab/issues/new?template=request-token.yml).
For other ideas, [open an issue](https://github.com/superKalo/crypto-tab/issues).

## Contributing

Ideas, fixes, and pull requests are welcome. Crypto Tab uses one codebase for the website and browser
extensions, built with vanilla JavaScript.

### Build and run locally

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

Crypto Tab opens its own page in a new tab automatically on first installation. If your browser asks
whether to keep the new tab change, confirm it to continue using Crypto Tab. After rebuilding, reload
the extension and open a fresh tab.
For the website, serve `dist/website/` with a local static web server.

Edit files in `src/`; the generated `dist/` directories are replaced on each build.

## License

Code and documentation are released under the [GPL-3.0 License](LICENSE).

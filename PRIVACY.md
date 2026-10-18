# Crypto Tab Privacy Policy

Last updated: October 18, 2026

## 1. Scope and purpose

This policy covers the Crypto Tab browser extension distributed through the Chrome Web Store and
Firefox Add-ons (AMO). It describes data handling by the extension and its requests to the Crypto Tab
price API. It does not cover browsing the separate Crypto Tab website or external websites.

Crypto Tab replaces your browser's New Tab page with cryptocurrency prices, historical price charts,
and a clock. You can choose a cryptocurrency, chart period, theme, price colors, and clock format.
The extension does not require an account.

## 2. Data stored on your device

Crypto Tab uses your browser's local extension storage to save:

-   Your selected cryptocurrency and chart period.
-   Your theme, price colors, and 12-hour or 24-hour clock preference.
-   Whether you have dismissed the introductory token-selection hint.
-   Cached public cryptocurrency prices and charts, together with cache update timestamps.
-   Internal state needed to maintain compatibility when the extension is updated.

These records let Crypto Tab remember your preferences, reduce repeat price requests, and display
previously fetched prices if a request fails. Preference changes are shared between open Crypto Tab
tabs within the same browser profile. The extension does not use browser cloud-sync storage or
provide cross-device synchronization.

The clock uses your device's time locally. Theme settings, colors, clock preferences, and hint status
are not sent to the price API. Your selected cryptocurrency and requested chart period are included
in price requests as described below.

## 3. Price requests and server data

To display prices, the extension sends HTTPS requests to `https://api.crypto-tab.com`. Requests
identify the cryptocurrency and the data needed, such as its current price or historical prices
for the selected chart period. When cached prices are missing or need refreshing, requests can be
triggered by loading a Crypto Tab page, changing the selected cryptocurrency or period, or an
automatic refresh while the page is visible.

The price API is hosted on Amazon Web Services (AWS) infrastructure in Europe (Frankfurt), Germany.
The API and its hosting infrastructure receive your IP address, the requested cryptocurrency and
period, and standard connection information supplied by your browser. The extension does not attach
an account ID, advertising ID, or a generated installation identifier.

The hosting infrastructure may retain technical logs, such as IP addresses, request paths, timestamps,
and response status, for service operation, security, and troubleshooting. Log collection and retention
depend on the server and AWS service settings. These technical logs are separate from your locally
stored preferences.

The price API maintains a database of public market prices. It retrieves market data from CoinGecko
on a schedule and serves stored prices to the extension. These server-to-server requests do not
forward your IP address, browser headers, or local preferences to CoinGecko.

## 4. Tracking and sensitive information

The extension contains no analytics, advertising, fingerprinting, tracking cookies, or automated
usage or crash-reporting services. It does not read your browsing history, bookmarks, search terms,
or the contents of other websites. The extension does not sell data or send it to advertising,
analytics, or data-broker services.

Crypto Tab does not connect to cryptocurrency wallets or request wallet addresses, private keys,
seed phrases, balances, transaction history, payment details, or account credentials. Displaying
public cryptocurrency prices does not require access to your personal financial information.

## 5. Extension permissions

Crypto Tab requests:

-   **Storage:** to save the local preferences, cached prices, and internal state described above.
-   **Access to `https://api.crypto-tab.com/*`:** to retrieve cryptocurrency prices over HTTPS.

The extension also declares a New Tab page replacement so that opening a new tab displays Crypto Tab.

## 6. External links and support

Crypto Tab includes links to external websites, such as CoinGecko, GitHub, and contributor websites.
Following a link opens that website, where its own privacy policy applies.

After you uninstall Crypto Tab, the browser opens an optional feedback page on
`https://crypto-tab.com/feedback/`. The extension registers this URL with its version and distribution
family (Chrome Web Store, including other Chromium browsers, or Firefox Add-ons) after the `#` in the
URL. This context is not sent in the initial website request; it is included only if you submit
feedback. The extension does not attach a unique installation identifier or your saved preferences.
The website host receives ordinary web request information when the page opens. Feedback answers are
sent only if you submit the form; an email address for a reply is optional. The separate
[Feedback Privacy notice](https://crypto-tab.com/feedback/privacy.html) describes submission through
Web3Forms, email delivery, and data handling on that page.

If you contact the maintainers by email, we receive your email address and whatever information you
choose to include. We use that information to respond to your request. If you open a GitHub issue,
your submission is public and is also subject to GitHub's privacy practices. Do not include private
keys, seed phrases, or other sensitive information in support messages or public issues.

## 7. Retention and your choices

Local preferences remain until changed or removed. Cached prices are replaced as fresh data is
fetched; older cached values may remain to display prices if a request fails.

You can change preferences in Crypto Tab's settings. Removing the extension through your browser
removes its local extension storage. Disabling or removing the extension stops future price requests
from it. Removing local data does not delete any server-side request logs described in section 3.

For questions about data handling or requests concerning information you have sent us, contact the
maintainers at the address below.

## 8. Changes and contact

We will update this policy when Crypto Tab's data practices change and revise the date above.

For privacy questions, contact the Crypto Tab maintainers at
[superkalo@goodmorning.dev](mailto:superkalo@goodmorning.dev).

Source code: [github.com/superKalo/crypto-tab](https://github.com/superKalo/crypto-tab).

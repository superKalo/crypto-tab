if (typeof importScripts === 'function') {
    // SuperRepo 2.1.4 expects the extension API to be exposed through window.
    self.window = { chrome: globalThis.chrome };
    importScripts(
        '../lib/dayjs.min.js',
        '../lib/utc.js',
        '../lib/index.js',
        'cryptoTokens.js',
        'priceApi.js',
        'priceRepositoryFactory.js'
    );
} else if (globalThis.chrome) {
    // Gecko exposes a Promise-based browser namespace, but SuperRepo 2.1.4
    // uses callback-style storage calls. Prefer Firefox's compatible chrome API.
    globalThis.msBrowser = globalThis.chrome;
}

globalThis.dayjs.extend(globalThis.dayjs_plugin_utc);

const repositoryFactory = new globalThis.App.PriceRepositoryFactory({
    storage: 'BROWSER_STORAGE',
});
const extensionApi = globalThis.browser || globalThis.chrome;

function serializeRepositoryResult(result) {
    return {
        data: result.data,
        error: result.error ? result.error.message || String(result.error) : null,
        isStale: result.isStale,
        lastFetched: result.lastFetched,
        ok: result.ok,
        repositoryKey: result.repositoryKey,
        source: result.source,
    };
}

function createFailureResult(cryptoType, period, error) {
    return {
        data: null,
        error: error instanceof Error ? error.message : String(error),
        isStale: false,
        lastFetched: null,
        ok: false,
        repositoryKey: `${cryptoType}:${period}`,
        source: 'none',
    };
}

function handleRepositoryRequest(period, cryptoType, sendResponse) {
    repositoryFactory
        .getData(cryptoType, period)
        .then((result) => sendResponse(serializeRepositoryResult(result)))
        .catch((error) => sendResponse(createFailureResult(cryptoType, period, error)));
}

function handleLegacyRequest(period, cryptoType, sendResponse) {
    globalThis.App.PriceApi.getPriceData(period, cryptoType)
        .then((data) => sendResponse({ data }))
        .catch((error) => sendResponse({ error: error.message }));
}

extensionApi.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (!request || typeof request !== 'object') {
        return false;
    }

    if (request.type === 'getCryptoPriceData') {
        const { period, cryptoType } = request;

        handleRepositoryRequest(period, cryptoType, sendResponse);

        return true;
    }

    // Keep already-open tabs from the previous extension version working while
    // Chrome replaces the background worker during an automatic update.
    if (request.type === 'getCryptoPrice') {
        const { period, cryptoType } = request;

        handleLegacyRequest(period, cryptoType, sendResponse);

        return true;
    }

    return false;
});

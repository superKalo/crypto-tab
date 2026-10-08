window.App = window.App || {};

window.App.PriceRepositoryClient = class PriceRepositoryClient {
    constructor() {
        this.localRepositoryFactory =
            App.ENV.platform === 'WEBSITE'
                ? new App.PriceRepositoryFactory({ storage: 'LOCAL_STORAGE' })
                : null;
    }

    getRepositoryKey(cryptoType, period) {
        return `${cryptoType}:${period}`;
    }

    async getData(cryptoType, period) {
        const repositoryKey = this.getRepositoryKey(cryptoType, period);

        if (!App.CryptoTokens.getEndpointPath(cryptoType, period)) {
            return this.createFailureResult(
                repositoryKey,
                new Error(`Unsupported price request: ${cryptoType}/${period}`)
            );
        }

        if (this.localRepositoryFactory) {
            return this.localRepositoryFactory.getData(cryptoType, period);
        }

        try {
            const result = await window.browser.runtime.sendMessage({
                type: 'getCryptoPriceData',
                period,
                cryptoType,
            });

            return this.deserializeResult(result, repositoryKey);
        } catch (error) {
            return this.createFailureResult(repositoryKey, error);
        }
    }

    deserializeResult(result, repositoryKey) {
        const validSources = ['network', 'cache', 'stale-cache', 'none'];
        const hasData = result?.data !== null && typeof result?.data !== 'undefined';
        const sourceHasData = result?.source !== 'none';

        if (
            !result ||
            result.repositoryKey !== repositoryKey ||
            !validSources.includes(result.source) ||
            typeof result.ok !== 'boolean' ||
            result.ok !== hasData ||
            result.ok !== sourceHasData
        ) {
            throw new Error('The extension returned an invalid repository result');
        }

        const errorMessage = typeof result.error === 'string' ? result.error : null;

        return {
            data: result.data ?? null,
            error: errorMessage
                ? new Error(errorMessage)
                : result.ok
                  ? null
                  : new Error('The extension could not retrieve price data'),
            isStale: result.source === 'stale-cache',
            lastFetched: Number.isFinite(result.lastFetched) ? result.lastFetched : null,
            ok: result.ok,
            repositoryKey,
            source: result.source,
        };
    }

    createFailureResult(repositoryKey, error) {
        return {
            data: null,
            error: error instanceof Error ? error : new Error(String(error)),
            isStale: false,
            lastFetched: null,
            ok: false,
            repositoryKey,
            source: 'none',
        };
    }
};

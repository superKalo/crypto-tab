window.App = window.App || {};

window.App.PriceRepositoryFactory = class PriceRepositoryFactory {
    constructor() {
        this.repositories = {};
        this.storage = App.ENV.platform === 'EXTENSION' ? 'BROWSER_STORAGE' : 'LOCAL_STORAGE';
    }

    getRepositoryKey(cryptoType, period) {
        return `${cryptoType}:${period}`;
    }

    getRepository(cryptoType, period) {
        const repositoryKey = this.getRepositoryKey(cryptoType, period);

        if (!this.repositories[repositoryKey]) {
            this.repositories[repositoryKey] = this.createRepository(cryptoType, period);
        }

        return this.repositories[repositoryKey];
    }

    createRepository(cryptoType, period) {
        const isCurrentPrice = period === 'NOW';

        return new SuperRepo({
            storage: this.storage,
            name: `prices-v1:${cryptoType}:${period}`,
            outOfDateAfter: isCurrentPrice ? 3 * 60 * 1000 : 15 * 60 * 1000,
            request: () => App.PriceApi.getPriceData(period, cryptoType),
            mapData: isCurrentPrice
                ? this.mapCurrentPrice
                : (data) => App.API.mapData(data, this.getLabelFormat(period)),
        });
    }

    async getData(cryptoType, period) {
        const repositoryKey = this.getRepositoryKey(cryptoType, period);
        const repository = this.getRepository(cryptoType, period);
        let cacheStatus;

        try {
            cacheStatus = await repository.getDataUpToDateStatus();
        } catch (error) {
            delete this.repositories[repositoryKey];

            return this.createResult({ error, repositoryKey });
        }

        if (cacheStatus.isDataUpToDate) {
            return this.createResult({
                data: cacheStatus.localData,
                lastFetched: cacheStatus.lastFetched,
                repositoryKey,
                source: 'cache',
            });
        }

        try {
            const data = await repository.getData();

            return this.createResult({
                data,
                lastFetched: Date.now(),
                repositoryKey,
                source: 'network',
            });
        } catch (error) {
            // SuperRepo 2.1.4 keeps a rejected request marked as pending. Evicting
            // the in-memory instance lets the next refresh retry while preserving
            // its last valid value in persistent storage.
            delete this.repositories[repositoryKey];

            if (cacheStatus.localData !== null) {
                return this.createResult({
                    data: cacheStatus.localData,
                    error,
                    lastFetched: cacheStatus.lastFetched,
                    repositoryKey,
                    source: 'stale-cache',
                });
            }

            return this.createResult({ error, repositoryKey });
        }
    }

    createResult({
        data = null,
        error = null,
        lastFetched = null,
        repositoryKey,
        source = 'none',
    }) {
        return {
            data,
            error,
            isStale: source === 'stale-cache',
            lastFetched,
            ok: data !== null,
            repositoryKey,
            source,
        };
    }

    mapCurrentPrice(data) {
        const { value, changePercent } = data[0];

        return {
            price: Number(value),
            changePercent: {
                dayAgo: Number(changePercent.dayAgo),
                weekAgo: Number(changePercent.weekAgo),
                monthAgo: Number(changePercent.monthAgo),
            },
        };
    }

    getLabelFormat(period) {
        const formats = {
            ALL: 'YYYY',
            ONE_YEAR: 'MMM YYYY',
            ONE_MONTH: 'D MMM',
            ONE_WEEK: 'dddd',
            ONE_DAY: 'HH:mm',
            ONE_HOUR: 'HH:mm',
        };

        return formats[period];
    }
};

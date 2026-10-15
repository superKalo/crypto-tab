globalThis.App = globalThis.App || {};

globalThis.App.PriceRepositoryFactory = class PriceRepositoryFactory {
    constructor({ storage = 'LOCAL_STORAGE', request = App.PriceApi.getPriceData } = {}) {
        this.repositories = {};
        this.request = request;
        this.storage = storage;
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
        const policy = App.CryptoTokens.getRefreshPolicy(period);

        const repository = new SuperRepo({
            storage: this.storage,
            name: `prices-v2:${cryptoType}:${period}`,
            outOfDateAfter: policy.interval,
            request: () => this.request(period, cryptoType),
            mapData: isCurrentPrice
                ? this.mapCurrentPrice
                : (data) => this.mapChartData(data, period),
        });

        // Apply the same clock boundary to both our cache read and SuperRepo's
        // internal recheck before a request, including after worker suspension.
        const getCacheStatus = repository.getDataUpToDateStatus.bind(repository);
        repository.getDataUpToDateStatus = async () => {
            const status = await getCacheStatus();
            const nextRefreshAt = App.CryptoTokens.getNextRefreshAt(period, status.lastFetched);
            const now = Date.now();
            // Older ALL caches contain years only; refresh them to recover monthly labels.
            const hasLegacyAllLabels =
                period === 'ALL' &&
                Array.isArray(status.localData) &&
                status.localData.some(({ timestamp }) => /^\d{4}$/.test(timestamp));

            return {
                ...status,
                isDataUpToDate:
                    status.isDataUpToDate &&
                    !hasLegacyAllLabels &&
                    nextRefreshAt !== null &&
                    status.lastFetched <= now &&
                    now < nextRefreshAt,
            };
        };

        return repository;
    }

    async getData(cryptoType, period) {
        const repositoryKey = this.getRepositoryKey(cryptoType, period);

        if (!App.CryptoTokens.getEndpointPath(cryptoType, period)) {
            return this.createResult({
                error: new Error(`Unsupported price request: ${cryptoType}/${period}`),
                repositoryKey,
            });
        }

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
            price: value,
            changePercent,
        };
    }

    mapChartData(data, period) {
        const labelFormat = this.getLabelFormat(period);

        return data
            .map(({ timestamp, value }) => {
                const date = dayjs.utc(timestamp < 1e12 ? timestamp * 1000 : timestamp);

                return {
                    value,
                    // ALL timestamps identify UTC calendar months, not local instants.
                    timestamp: (period === 'ALL' ? date : date.local()).format(labelFormat),
                };
            })
            .reverse();
    }

    getLabelFormat(period) {
        const formats = {
            ALL: 'MMM YYYY',
            ONE_YEAR: 'MMM YYYY',
            ONE_MONTH: 'D MMM',
            ONE_WEEK: 'dddd',
            ONE_DAY: 'HH:mm',
            ONE_HOUR: 'HH:mm',
        };

        return formats[period];
    }
};

globalThis.App = globalThis.App || {};

globalThis.App.StorageMigration = class StorageMigration {
    constructor({ storageArea, runtime }) {
        this.storageArea = storageArea;
        this.runtime = runtime;
        this.versionKey = 'storage-schema-version';
        this.migrations = [
            {
                version: 2,
                run: () => this.removeLegacyPriceCache(),
            },
        ];
    }

    async migrate() {
        const storedState = await this.callStorage('get', this.versionKey);
        let storedVersion = Number(storedState[this.versionKey]) || 0;

        for (const migration of this.migrations) {
            if (storedVersion >= migration.version) {
                continue;
            }

            await migration.run();
            await this.callStorage('set', { [this.versionKey]: migration.version });
            storedVersion = migration.version;
        }
    }

    async removeLegacyPriceCache() {
        await this.callStorage('remove', this.getLegacyPriceKeys());
    }

    getLegacyPriceKeys() {
        // Only Bitcoin used this cache-key format in a released extension version.
        const periods = ['NOW', 'ONE_HOUR', 'ONE_DAY', 'ONE_WEEK', 'ONE_MONTH', 'ONE_YEAR', 'ALL'];

        return periods.map((period) => `bitcoin-${period}`);
    }

    callStorage(method, value) {
        return new Promise((resolve, reject) => {
            this.storageArea[method](value, (result) => {
                const error = this.runtime.lastError;

                if (error) {
                    reject(new Error(error.message));
                    return;
                }

                resolve(result);
            });
        });
    }
};

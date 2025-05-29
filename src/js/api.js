window.App = window.App || {};

class API {
    constructor(apiAdapter) {
        this.apiAdapter = apiAdapter;
    }

    get(_endpoint) {
        App.Loader.init();

        return this.apiAdapter.getBitcoinRatesForPeriod(_endpoint).then((r) => {
            App.Message.clear();
            App.Loader.destroy();
            return r;
        });
    }

    mapData(_r, _period) {
        return this.apiAdapter.mapData(_r, _period);
    }

    getBitcoinRatesForAll() {
        return this.apiAdapter.getBitcoinRatesForAll();
    }

    getBitcoinRatesForOneYear() {
        return this.apiAdapter.getBitcoinRatesForOneYear();
    }

    getBitcoinRatesForOneMonth() {
        return this.apiAdapter.getBitcoinRatesForOneMonth();
    }

    getBitcoinRatesForOneWeek() {
        return this.apiAdapter.getBitcoinRatesForOneWeek();
    }

    getBitcoinRatesForOneDay() {
        return this.apiAdapter.getBitcoinRatesForOneDay();
    }

    getBitcoinRatesForOneHour() {
        return this.apiAdapter.getBitcoinRatesForOneHour();
    }

    getBitcoinRatesNow() {
        return this.apiAdapter.getBitcoinRatesNow();
    }
}

// window.App.API = new API(App.apiFakeAdapter);
//window.App.API = new API(App.apiGoranAdapter);
window.App.API = new API(App.apiBoyoAdapter);

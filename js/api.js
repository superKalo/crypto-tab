window.App = window.App || {};

class API {
    constructor(apiAdapter) {
        this.apiAdapter = apiAdapter;
    }

    get(_endpoint) {
        App.Loader.init();

        return axios.get(this.apiAdapter.baseURL + _endpoint)
            .then( r => r.data )
            .then (r => {
                App.Message.clear();
                App.Loader.destroy();

                return r;
            })
            .catch( (jqXHR, textStatus, errorThrown) => {
                App.Loader.destroy();
                App.Message.fireError('That\'s extremely sad. ' + jqXHR);

                return Promise.reject();
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
};

// window.App.API = new API(App.apiFakeAdapter);
window.App.API = new API(App.apiGoranAdapter);

window.App = window.App || {};

class API {
    constructor(apiAdapter) {
        this.apiAdapter = apiAdapter;
    }

    get(_endpoint) {
        return axios.get(this.apiAdapter.baseURL + _endpoint)
            .then( r => r.data )
            .catch( (jqXHR, textStatus, errorThrown) =>
               console.log(jqXHR, textStatus, errorThrown));
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

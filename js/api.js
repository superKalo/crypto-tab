window.App = window.App || {};

window.App.API = {
    baseURL: 'https://apiv2.bitcoinaverage.com/',

    fetch: function(_endpoint) {
        return axios.get(this.baseURL + _endpoint)
            .then( r => r.data )
            .catch( (jqXHR, textStatus, errorThrown) =>
               console.log(jqXHR, textStatus, errorThrown));
    },

    getBitcoinRatesForAll: function() {
        return this.fetch('all');
    },

    getBitcoinRatesForOneYear: function() {
        return this.fetch('year');
    },

    getBitcoinRatesForOneMonth: function() {
        return this.fetch('month');
    },

    getBitcoinRatesForOneWeek: function() {
        return this.fetch('week');
    },

    getBitcoinRatesForOneDay: function() {
        return this.fetch('indices/global/history/BTCUSD?period=daily&?format=json').then(data => {
          // TODO: Calculate avarage price per hour

          const nextData = {};

          data.forEach( rec => {
            const date = new Date(rec.time);

            const hour = date.getHours();

            if (nextData[hour]) {
              nextData[hour].average = (nextData[hour].average + rec.average) / 2;
            } else {
                nextData[hour] = {
                  average: rec.average,
                  time: rec.time
                };
            }
          });

          const result = [];
          for (let key of Object.keys(nextData)) {
            result.push(nextData[key]);
          }

          return result;
        });
    },

    getBitcoinRatesForOneHour: function() {
        return this.fetch('hour');
    }
};

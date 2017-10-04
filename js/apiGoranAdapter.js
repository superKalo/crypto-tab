window.App = window.App || {};

window.App.apiGoranAdapter = {
    baseURL: 'https://apiv2.bitcoinaverage.com/',

    get: function(_endpoint) {
        return App.API.get(_endpoint);
    },

    mapData: function(response, dateLabelFormat) {
        return response.map( _rec => ({
            value: _rec.average,
            timestamp: moment(_rec.time).format(dateLabelFormat)
        }));
    },

    getBitcoinRatesForAll: function() {
        return this.get('all');
    },

    getBitcoinRatesForOneYear: function() {
        return this.get('year');
    },

    getBitcoinRatesForOneMonth: function() {
        return this.get('month');
    },

    getBitcoinRatesForOneWeek: function() {
        return this.get('week');
    },

    getBitcoinRatesForOneDay: function() {
        return this.get('indices/global/history/BTCUSD?period=daily&?format=json').then(data => {
          const nextData = {};

          data.forEach( rec => {
            const date = new Date(rec.time);

            const hour = date.getHours();

            if (nextData[hour]) {
              nextData[hour].average.push(rec.average);
            } else {
                nextData[hour] = {
                  average: [rec.average],
                  time: rec.time
                };
            }
          });

          const result = [];
          for (let key of Object.keys(nextData)) {
            result.push(nextData[key]);
          }

          return result.map( rec => ({
            average: parseInt(rec.average.reduce((a,b) => a + b) / rec.average.length),
            time: rec.time
          }));
        });
    },

    getBitcoinRatesForOneHour: function() {
        return this.get('hour');
    }
};

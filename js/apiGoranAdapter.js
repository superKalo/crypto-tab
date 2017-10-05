window.App = window.App || {};

window.App.apiGoranAdapter = {
    baseURL: 'https://apiv2.bitcoinaverage.com/',

    get: function(_endpoint) {
        return App.API.get(_endpoint);
    },

    mapData: function(response, dateLabelFormat) {
        return response.map( _rec => ({
            value: _rec.average,
            timestamp: moment(moment.utc(_rec.time)).local().format(dateLabelFormat)
        }));
    },

    getBitcoinRatesForAll: function() {
        return this.get('all');
    },

    getBitcoinRatesForOneYear: function() {
        return this.get('year');
    },

    getBitcoinRatesForOneMonth: function() {
        return this.get('indices/global/history/BTCUSD?period=monthly&?format=json').then(data => {
            const nextData = {};

            data.forEach( rec => {
                const date = new Date(rec.time);

                const dayOfTheMonth = date.getDate();
                date.setMinutes(0);
                date.setHours(1);
                date.setSeconds(0);

                if (nextData[dayOfTheMonth]) {
                  nextData[dayOfTheMonth].average.push(rec.average);
                } else {
                    nextData[dayOfTheMonth] = {
                      average: [rec.average],
                      time: date.valueOf()
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

    getBitcoinRatesForOneWeek: function() {
        return this.get('week');
    },

    getBitcoinRatesForOneDay: function() {
        return this.get('indices/global/history/BTCUSD?period=daily&?format=json').then(data => {
          const nextData = {};

          function createDateAsUTC(date) {
            return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
          }

          data.forEach( rec => {
            const date = createDateAsUTC(new Date(rec.time));
            date.setMinutes(0);

            const hour = date.getHours();
            const dayOfTheMonth = date.getDate();
            const key = `${dayOfTheMonth}-${hour}`;

            if (nextData[key]) {
              nextData[key].average.push(rec.average);
            } else {
                nextData[key] = {
                  average: [rec.average],
                  time: date.valueOf()
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
          })).reverse();
        });
    },

    getBitcoinRatesForOneHour: function() {
        return this.get('hour');
    }
};

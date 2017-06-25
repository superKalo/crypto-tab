window.App = window.App || {};

window.App.API = {
    baseURL: 'fake-api/',

    fetch: function(_endpoint) {
        return $.ajax({ url: this.baseURL + _endpoint + '.json' });
    },

    getBitcoinRatesForAll: function() {
        return this.fetch('all');
        // return {
        //     labels: ['Jan 2016', 'Feb 2016', 'Mar 2016', 'Apr 2016', 'May 2016', 'Jun 2016', 'Jul 2016', 'Aug 2016', 'Sep 2016', 'Oct 2016', 'Nov 2016', 'Dec 2016', 'Jan 2017', 'Feb 2017', 'Mar 2017', 'Apr 2017', 'May 2017', 'Jun 2017', 'Jul 2017', 'Aug 2017', 'Sep 2017', 'Oct 2017', 'Nov 2017', 'Dec 2017', ],
        //     values: [1,31,18,32,26,81,54,41,75,80,49,40,31,18,32,26,81,54,41,75,80,49,40, 8]
        // }
    },

    getBitcoinRatesForOneYear: function() {
        return this.fetch('year');
        // return {
        //     labels: ['Jan 2017', 'Feb 2017', 'Mar 2017', 'Apr 2017', 'May 2017', 'Jun 2017', 'Jul 2017', 'Aug 2017', 'Sep 2017', 'Oct 2017', 'Nov 2017', 'Dec 2017'],
        //     values: [1,31,18,32,26,81,54,41,75,80,49,40]
        // }
    },

    getBitcoinRatesForOneMonth: function() {
        return this.fetch('month');
        // return {
        //     labels: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '10th', '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th', '21st', '22nd', '23rd', '24th', '25th', '27th', '28th', '29th', '30th', '31th'],
        //     values: [50, 55, 54, 57, 60, 65, 66, 68, 65, 66, 67, 70, 72, 74, 70, 80, 77, 76, 75, 72, 74, 71, 70, 69, 71, 73, 74, 76, 80, 90, 88]
        // }
    },

    getBitcoinRatesForOneWeek: function() {
        return this.fetch('week');
        // return {
        //     labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        //     values: [85,74,47,1,65,32, 49]
        // }
    },

    getBitcoinRatesForOneDay: function() {
        return this.fetch('day');
        // return {
        //     labels: ['13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00'],
        //     values: [50, 55, 54, 57, 60, 65, 66, 68, 65, 66, 67, 70, 72, 74, 70, 80, 77, 76, 75, 72, 74, 71, 70, 69]
        // }
    },

    getBitcoinRatesForOneHour: function() {
        return this.fetch('hour');
    }
};

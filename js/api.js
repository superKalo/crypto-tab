window.Api = function() { };

Api.getBitcoinRatesForAll = function() {
    return {
        labels: ['January 2016', 'February 2016', 'March 2016', 'April 2016', 'May 2016', 'June 2016', 'July 2016', 'August 2016', 'September 2016', 'October 2016', 'November 2016', 'December 2016', 'January 2017', 'February 2017', 'March 2017', 'April 2017', 'May 2017', 'June 2017', 'July 2017', 'August 2017', 'September 2017', 'October 2017', 'November 2017', 'December 2017', ],
        values: [1,31,18,32,26,81,54,41,75,80,49,40,31,18,32,26,81,54,41,75,80,49,40, 8]
    }
}

Api.getBitcoinRatesForOneYear = function() {
    return {
        labels: ['January 2017', 'February 2017', 'March 2017', 'April 2017', 'May 2017', 'June 2017', 'July 2017', 'August 2017', 'September 2017', 'October 2017', 'November 2017', 'December 2017'],
        values: [1,31,18,32,26,81,54,41,75,80,49,40]
    }
}

Api.getBitcoinRatesForOneMonth = function() {
    return {
        labels: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '10th', '11th', '12th', '13th'],
        values: [92,23,21,31,18,32,26,81,54,41,75,80]
    }
}

Api.getBitcoinRatesForOneWeek = function() {
    return {
        labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        values: [85,74,47,1,65,32, 49]
    }
}

Api.getBitcoinRatesForOneDay = function() {
    return {
        labels: ['13:00', '13:15', '13:30', '13:45', '14:00', '14:15', '14:30'],
        values: [23, 85, 74, 47, 1, 65, 32]
    }
}

Api.getBitcoinRatesForOneHour = function() {
    return {
        labels: ['13:00', '13:15', '13:30', '13:45', '14:00'],
        values: [20, 82, 74, 27, 77]
    }
}

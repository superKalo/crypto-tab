window.App = window.App || {};

/**
 * Simple and efficient clock with 12h/24h format support.
 */
App.Clock = function () {
    this.time = '';
    this.clockElement = document.getElementById('clock');
    this.format = '24h'; // Default format, will be loaded from settings

    this.init();
};

// Initialize clock with settings
App.Clock.prototype.init = async function () {
    const settings = await window.App.Settings.get();
    this.format = settings.clockFormat || '24h';
    this.update();
};

// Set new format dynamically
App.Clock.prototype.updateFormat = function (newFormat) {
    this.format = newFormat;
    this.time = ''; // Reset to force immediate update
    this.setTime();
};

App.Clock.prototype.setTime = function () {
    const today = new Date();
    let h = today.getHours();
    const m = ('0' + today.getMinutes()).slice(-2);
    let period = ''; // Used for 12-hour format

    if (this.format === '12h') {
        // Convert to 12-hour format
        period = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12; // Convert "0" hour to "12"
    }

    const timeWithoutPeriod = `${h}:${m}`; // Time without AM/PM
    if (timeWithoutPeriod !== this.time) {
        this.time = timeWithoutPeriod;

        // Update the clock's main time
        const timeElement = document.getElementById('clock-time');
        timeElement.innerText = timeWithoutPeriod;

        // Update the period if in 12h format
        const periodElement = document.getElementById('clock-period');
        if (this.format === '12h') {
            periodElement.innerText = period;
            periodElement.style.display = '';
        } else {
            periodElement.innerText = '';
            periodElement.style.display = 'none';
        }
    }
};

App.Clock.prototype.update = function () {
    this.setTime();

    // Calculate the remaining time until the next minute
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => this.update(), delay);
};

// Initialize the clock and save its instance
window.App.ClockInstance = new window.App.Clock();

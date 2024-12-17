window.App = window.App || {};

/**
 * Simple and efficient clock with 12h/24h format support.
 */
App.Clock = function () {
    this.time = '';
    this.clockElement = document.getElementById('clock');
    this.format = localStorage.getItem('clockFormat') || '24h';

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

    const currentTime =
        this.format === '24h'
            ? `${h}:${m}`
            : `${h}:${m}<span class="clock-period">${period}</span>`;

    if (currentTime !== this.time) {
        this.time = currentTime;
        this.clockElement.innerHTML = currentTime;
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

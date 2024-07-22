window.App = window.App || {};

/**
 * Simple and efficient clock.
 */
App.Clock = function () {
    this.time = '';
    this.clockElement = document.getElementById('clock');

    this.update();
};

App.Clock.prototype.setTime = function () {
    const today = new Date();

    const h = today.getHours();
    // Add zero in front of numbers < 10
    const m = ('0' + today.getMinutes()).slice(-2);

    const currentTime = h + ':' + m;

    if (currentTime !== this.time) {
        this.time = currentTime;
        this.clockElement.innerText = currentTime;
    }
};

App.Clock.prototype.update = function () {
    this.setTime();

    // Calculate the remaining time until the next minute
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => this.update(), delay);
};

// Initialize the clock
new window.App.Clock();
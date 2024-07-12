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
        return true; // Time updated
    }
    return false; // Time not updated
};

App.Clock.prototype.update = function () {
    const timeChanged = this.setTime();

    if (timeChanged) {
        // Calculate the remaining time until the next minute
        const now = new Date();
        const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
        setTimeout(() => requestAnimationFrame(this.update.bind(this)), delay);
    } else {
        requestAnimationFrame(this.update.bind(this));
    }
};

// Initialize the clock
new window.App.Clock();

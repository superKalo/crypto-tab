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
    const m = ('0' + today.getMinutes()).slice(-2);

    const currentTime = h + ':' + m;

    if (currentTime !== this.time) {
        this.time = currentTime;
        this.clockElement.innerText = currentTime;
    }
};

App.Clock.prototype.update = function () {
    this.setTime();
    requestAnimationFrame(this.update.bind(this));
};

// Initialize the clock
new window.App.Clock();

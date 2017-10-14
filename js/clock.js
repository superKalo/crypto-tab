window.App = window.App || {};

/**
 * Yes, that's the most simple clock in the world.
 */
App.Clock = function(){
    // String that holds the current time (hours and minutes)
    this.time;

    this.setTime();

    setInterval(this.setTime, 1000);
}

/**
 * Source: https://www.w3schools.com/js/tryit.asp?filename=tryjs_timing_clock
 */
App.Clock.prototype.setTime = function() {
    const today = new Date();

    const h = today.getHours();
    // Add zero in front of numbers < 10
    const m = ('0' + today.getMinutes()).slice(-2);

    const currentTime = h + ':' + m;

    if (currentTime !== this.time) {
        this.time = currentTime;

        document.getElementById('clock').innerText = currentTime;
    }
}

new window.App.Clock();

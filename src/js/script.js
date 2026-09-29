window.App.Crypto.init().catch((error) => {
    window.App.Message.fireError(`Unable to initialize Crypto Tab. ${error.message}`);
});

window.onload = () => {
    const { platform } = App.ENV;

    // Display platform specific DOM elements
    [...document.querySelectorAll(`[data-platform="${platform}"]`)].forEach((el) => {
        el.classList.remove('hidden');
    });
};

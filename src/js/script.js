window.App.Crypto.init().catch((error) => {
    window.App.Crypto.$priceHeading.setAttribute('aria-busy', 'false');
    window.App.Message.fireError(`Unable to initialize Crypto Tab. ${error.message}`);
});

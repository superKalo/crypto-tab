window.App.I18n.ready
    .then(() => window.App.Crypto.init())
    .catch((error) => {
        window.App.Crypto.$priceHeading.setAttribute('aria-busy', 'false');
        window.App.Message.fireError(window.App.I18n.t('errors.initialization'));
        console.error('Unable to initialize Crypto Tab.', error);
    });

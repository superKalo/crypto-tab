window.App.Bitcoin.init();

window.onload = () => {
    const { platform } = App.ENV;

    // Display platform specific DOM elements
    [...document.querySelectorAll(`[data-platform="${platform}"]`)].forEach( el => {
        el.classList.remove('hidden');
    });

    window.App.Loader.displayPage();
};

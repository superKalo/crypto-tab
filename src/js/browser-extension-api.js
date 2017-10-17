/**
 * Тhe Extension API model is currently being standardized to browser.xxx,
 * and some browsers are defining their own namespaces in the meantime
 * (for example, Edge is using msBrowser).
 *
 * Fortunately, most of the API remains the same behind the browser.
 * So, it’s very simple to support all browsers and namespace definitions.
 *
 * You’ll also need to use the subset of the API supported by all browsers:
 *  - Microsoft Edge: https://docs.microsoft.com/en-us/microsoft-edge/extensions/api-support
 *  - Mozilla Firefox: https://developer.mozilla.org/en-US/Add-ons/WebExtensions
 *  - Opera: https://dev.opera.com/extensions/apis/
 */
window.browser = (function () {
  return window.msBrowser ||
    window.browser ||
    window.chrome;
})();

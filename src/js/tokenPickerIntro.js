window.App = window.App || {};

window.App.TokenPickerIntro = {
    storageKey: 'token-picker-intro-v1',
    dismissed: false,
    showTimer: null,
    $card: document.getElementById('token-picker-intro'),
    $trigger: document.getElementById('price-token-select'),

    async init() {
        document
            .getElementById('dismiss-token-intro')
            .addEventListener('click', () => this.dismiss());
        this.$card.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                this.dismiss();
            }
        });

        this.handleStorageChange = (changes, area) => {
            if (area === 'local' && changes[this.storageKey]?.newValue === true) {
                this.hide();
            }
        };
        this.handleWebsiteStorage = (event) => {
            if (event.key === this.storageKey && event.newValue === 'true') {
                this.hide();
            }
        };

        if (App.ENV.platform === 'EXTENSION') {
            window.browser.storage.onChanged.addListener(this.handleStorageChange);
        } else {
            window.addEventListener('storage', this.handleWebsiteStorage);
        }

        this.handleResize = () => this.position();
        window.addEventListener('resize', this.handleResize);
        this.headingObserver = new MutationObserver(() => this.position());
        this.headingObserver.observe(this.$trigger.closest('h2'), {
            childList: true,
            characterData: true,
            subtree: true,
        });
        window.addEventListener('pagehide', () => this.hide(), { once: true });

        try {
            const dismissed = await App.Settings.isHintDismissed(this.storageKey);

            // A picker or another tab may have dismissed it while storage was loading.
            if (dismissed || this.dismissed) {
                this.hide();
                return;
            }

            this.showTimer = window.setTimeout(() => {
                this.showTimer = null;
                this.$card.hidden = false;
                this.$trigger.setAttribute('aria-describedby', 'token-intro-description');
                this.position();
            }, 500);
        } catch (error) {
            this.hide();
            console.warn('Unable to read the token introduction preference.', error);
        }
    },

    position() {
        if (this.$card.hidden) {
            return;
        }

        const container = this.$card.parentElement.getBoundingClientRect();
        const trigger = this.$trigger.getBoundingClientRect();
        const width = this.$card.offsetWidth;
        const anchor = trigger.left - container.left + trigger.width / 2;
        const left = Math.max(0, Math.min(anchor - width / 2, container.width - width));

        this.$card.style.left = `${left}px`;
        this.$card.style.setProperty('--intro-arrow-left', `${anchor - left}px`);
    },

    hide() {
        this.dismissed = true;
        window.clearTimeout(this.showTimer);
        this.showTimer = null;
        if (this.$card.contains(document.activeElement)) {
            this.$trigger.focus();
        }
        this.$card.hidden = true;
        this.$trigger.removeAttribute('aria-describedby');
        this.headingObserver?.disconnect();
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('storage', this.handleWebsiteStorage);
        if (this.handleStorageChange && App.ENV.platform === 'EXTENSION') {
            window.browser.storage.onChanged.removeListener(this.handleStorageChange);
        }
    },

    async dismiss() {
        if (this.dismissed) {
            return;
        }

        this.hide();
        try {
            await App.Settings.dismissHint(this.storageKey);
        } catch (error) {
            console.warn('Unable to save the token introduction preference.', error);
        }
    },
};

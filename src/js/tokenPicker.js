window.App = window.App || {};

window.App.TokenPicker = (function () {
    const instances = [];

    return class TokenPicker {
        constructor({ container, trigger, options, menu = container, onSelect, onOpen }) {
            this.container = container;
            this.trigger = trigger;
            this.options = options;
            this.menu = menu;
            this.onSelect = onSelect;
            this.onOpen = onOpen;
            this.isDetails = container.tagName === 'DETAILS';

            this.populateOptions();
            this.renderSelected(window.App.CryptoTokens.getDefaultToken());
            this.setOpen(false);
            instances.push(this);

            if (this.isDetails) {
                container.addEventListener('toggle', () => {
                    if (this.isOpen()) {
                        this.closeOtherPickers();
                        this.onOpen?.();
                    }
                });
            } else {
                trigger.addEventListener('click', () => this.setOpen(!this.isOpen()));
            }

            container.addEventListener('keydown', (event) => this.handleKeydown(event));
            container.addEventListener('focusout', (event) => this.handleFocusout(event));

            if (!container.contains(menu)) {
                menu.addEventListener('keydown', (event) => this.handleKeydown(event));
                menu.addEventListener('focusout', (event) => this.handleFocusout(event));
            }

            document.addEventListener('click', (event) => {
                if (!this.contains(event.target)) {
                    this.setOpen(false);
                }
            });
        }

        static createIdentity(token) {
            const selectionName = token.selectionName || token.displayName;
            const identity = document.createElement('span');
            identity.className = 'token-identity';

            const logo = document.createElement('img');
            logo.className = 'token-logo';
            logo.src = token.logoPath;
            logo.alt = '';
            logo.width = 32;
            logo.height = 32;

            const name = document.createElement('span');
            name.className = 'token-name';
            name.textContent = selectionName;

            identity.append(logo, name);

            if (token.symbol !== selectionName) {
                const symbol = document.createElement('span');
                symbol.className = 'token-symbol';
                symbol.textContent = token.symbol;
                identity.appendChild(symbol);
            }

            return identity;
        }

        populateOptions() {
            this.options.replaceChildren();

            window.App.CryptoTokens.getAllTokens().forEach((token) => {
                const row = document.createElement('li');
                row.className = 'token-option-row';

                const option = document.createElement('button');
                option.type = 'button';
                option.className = 'token-option';
                option.dataset.token = token.id;
                option.appendChild(TokenPicker.createIdentity(token));
                option.addEventListener('click', () => {
                    this.onSelect(token.id);
                    this.setOpen(false, true);
                });

                const description = document.createElement('span');
                description.className = 'token-option-description';
                description.textContent = token.description;
                option.appendChild(description);

                const link = document.createElement('a');
                link.className = 'token-link';
                link.href = token.coinGeckoUrl;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Learn more';
                link.setAttribute('aria-label', `Learn more about ${token.displayName}`);

                row.append(option, link);
                this.options.appendChild(row);
            });

            this.optionButtons = [...this.options.querySelectorAll('.token-option')];
        }

        renderSelected(tokenId) {
            const token =
                window.App.CryptoTokens.getToken(tokenId) ||
                window.App.CryptoTokens.getToken(window.App.CryptoTokens.getDefaultToken());
            const selectionName = token.selectionName || token.displayName;

            this.trigger.setAttribute(
                'aria-label',
                `Change token: ${selectionName} (${token.symbol})`
            );
            this.optionButtons.forEach((option) => {
                const isSelected = option.dataset.token === token.id;
                option.setAttribute('aria-pressed', String(isSelected));
                option.closest('.token-option-row').classList.toggle('is-selected', isSelected);
            });
        }

        isOpen() {
            return this.isDetails ? this.container.open : !this.menu.hidden;
        }

        setOpen(open, restoreFocus = false) {
            const wasOpen = this.isOpen();

            if (this.isDetails) {
                this.container.open = open;
            } else {
                this.menu.hidden = !open;
                this.trigger.setAttribute('aria-expanded', String(open));
            }

            if (open) {
                this.closeOtherPickers();
                if (!wasOpen && !this.isDetails) {
                    this.onOpen?.();
                }
            }

            if (restoreFocus) {
                this.trigger.focus();
            }
        }

        closeOtherPickers() {
            instances.forEach((picker) => {
                if (picker !== this) {
                    picker.setOpen(false);
                }
            });
        }

        contains(target) {
            return Boolean(
                target &&
                    ((this.isDetails && this.container.contains(target)) ||
                        this.trigger.contains(target) ||
                        this.menu.contains(target))
            );
        }

        handleFocusout(event) {
            if (!this.contains(event.relatedTarget)) {
                this.setOpen(false);
            }
        }

        handleKeydown(event) {
            if (event.key === 'Escape' && this.isOpen()) {
                event.preventDefault();
                event.stopPropagation();
                this.setOpen(false, true);
                return;
            }

            const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
            const option = event.target.closest('.token-option');

            if (
                !keys.includes(event.key) ||
                (!this.trigger.contains(event.target) && !this.optionButtons.includes(option))
            ) {
                return;
            }

            event.preventDefault();
            this.setOpen(true);

            const index = this.optionButtons.indexOf(option);
            let nextIndex;

            if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = this.optionButtons.length - 1;
            } else if (index === -1) {
                nextIndex = this.optionButtons.findIndex(
                    (item) => item.getAttribute('aria-pressed') === 'true'
                );
            } else {
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                nextIndex =
                    (index + direction + this.optionButtons.length) % this.optionButtons.length;
            }

            this.optionButtons[nextIndex].focus();
        }
    };
})();

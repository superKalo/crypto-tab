(() => {
    // Public form key: routes submissions to the maintainer's verified email address.
    const accessKey = 'cf262972-16d6-4520-97a9-12f1ed563e21';
    const form = document.getElementById('feedback-form');
    const fields = document.getElementById('feedback-fields');
    const sendButton = document.getElementById('send-feedback');
    const status = document.getElementById('feedback-status');
    const alternativeFields = document.getElementById('alternative-fields');
    const alternative = document.getElementById('alternative');
    const alternativeOtherField = document.getElementById('alternative-other-field');
    const alternativeOther = document.getElementById('alternative-other');
    const cryptocurrencyField = document.getElementById('cryptocurrency-field');
    const cryptocurrency = document.getElementById('cryptocurrency');
    const replyRequested = document.getElementById('reply-requested');
    const emailField = document.getElementById('email-field');
    const email = document.getElementById('email');
    const reasons = {
        'default-new-tab': 'I prefer the default New Tab page.',
        'another-new-tab': 'I prefer another New Tab extension.',
        'missing-cryptocurrency': 'A cryptocurrency I want is missing.',
        'design-customization': "The design or customization wasn't for me.",
        other: 'Other',
    };
    let isSending = false;

    function updateConditionalFields() {
        const reason = form.elements.reason.value;
        const showAlternative = reason === 'another-new-tab';
        const showAlternativeOther = showAlternative && alternative.value === 'Other';
        const showCryptocurrency = reason === 'missing-cryptocurrency';

        alternativeFields.hidden = !showAlternative;
        alternative.disabled = !showAlternative;
        alternativeOtherField.hidden = !showAlternativeOther;
        alternativeOther.disabled = !showAlternativeOther;
        cryptocurrencyField.hidden = !showCryptocurrency;
        cryptocurrency.disabled = !showCryptocurrency;
        emailField.hidden = !replyRequested.checked;
        email.disabled = !replyRequested.checked;
    }

    function createSubmission() {
        const reason = form.elements.reason.value;
        const params = new URLSearchParams(window.location.hash.slice(1));
        const store = params.get('store');
        const version = params.get('version') || '';
        const submission = {
            access_key: accessKey,
            subject: 'Crypto Tab uninstall feedback',
            from_name: 'Crypto Tab feedback',
            reason: reasons[reason],
        };

        if (reason === 'another-new-tab' && alternative.value) {
            submission.new_tab_extension =
                alternative.value === 'Other'
                    ? alternativeOther.value.trim() || 'Other'
                    : alternative.value;
        }
        if (reason === 'missing-cryptocurrency' && cryptocurrency.value.trim()) {
            submission.cryptocurrency = cryptocurrency.value.trim();
        }
        const message = form.elements.message.value.trim();
        if (message) {
            submission.message = message;
        }
        if (replyRequested.checked && email.value.trim()) {
            submission.email = email.value.trim();
        }

        // Keep technical metadata in one compact field after the answers.
        const context = [`reason=${reason}`, 'form=1'];
        if (['chrome-web-store', 'firefox-addons'].includes(store)) {
            context.push(`store=${store}`);
        }
        if (version.length <= 32 && /^\d+(?:\.\d+){0,3}$/.test(version)) {
            context.push(`version=${version}`);
        }
        submission.context = context.join('; ');
        if (form.elements.botcheck.checked) {
            submission.botcheck = true;
        }

        return submission;
    }

    form.addEventListener('change', (event) => {
        updateConditionalFields();
        if (event.target === alternative && !alternativeOtherField.hidden) {
            alternativeOther.focus();
        }
        if (event.target.name === 'reason' && event.target.value === 'other') {
            document.getElementById('message-details').open = true;
        }
    });
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (isSending || !form.reportValidity()) {
            return;
        }

        const submission = createSubmission();
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);

        isSending = true;
        fields.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending…';
        form.setAttribute('aria-busy', 'true');
        status.textContent = '';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                credentials: 'omit',
                referrerPolicy: 'origin',
                body: JSON.stringify(submission),
                signal: controller.signal,
            });
            const result = await response.json();
            if (!response.ok || result.success !== true) {
                throw new Error('Feedback submission was not accepted');
            }

            document.getElementById('feedback-content').hidden = true;
            document.getElementById('feedback-success').hidden = false;
            document.getElementById('success-title').focus();
        } catch {
            status.textContent =
                "We couldn't send your feedback. Your answers are still here. Please try again.";
        } finally {
            window.clearTimeout(timeout);
            isSending = false;
            fields.disabled = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send feedback';
            form.removeAttribute('aria-busy');
        }
    });

    // Also synchronize controls restored by the browser after navigating back.
    window.addEventListener('pageshow', updateConditionalFields);
    updateConditionalFields();
    sendButton.disabled = false;
})();

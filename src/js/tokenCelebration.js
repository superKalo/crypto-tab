window.App = window.App || {};

// Both previews share one lifecycle. Confetti sleeps between bursts; the fire's small,
// advected heat field is limited to 24fps. Neither runs while hidden or being interacted with.
window.App.TokenCelebration = class TokenCelebration {
    constructor(canvas, trigger, effect = 'confetti') {
        this.canvas = canvas;
        this.trigger = trigger;
        this.effect = effect;
        this.context = canvas.getContext('2d');
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.active = false;
        this.frame = null;
        this.lastFrame = 0;
        this.startedAt = null;
        this.wakeTimer = null;
        this.destroyed = false;
        this.handleInteraction = () => queueMicrotask(() => this.update());
        this.tick = (now) => {
            this.frame = null;
            if (!this.canAnimate()) {
                return;
            }
            if (this.effect === 'confetti' && this.startedAt !== null) {
                const phase = Math.max(0, now / 1000 - this.startedAt) % 8;
                if (phase >= 3) {
                    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.wakeTimer = window.setTimeout(
                        () => {
                            this.wakeTimer = null;
                            this.update();
                        },
                        (8 - phase) * 1000
                    );
                    return;
                }
            }
            if (now - this.lastFrame >= 1000 / 24) {
                if (this.effect === 'confetti') {
                    this.renderConfetti(now / 1000);
                } else {
                    this.render(now / 1000);
                }
                this.lastFrame = now - ((now - this.lastFrame) % (1000 / 24));
            }
            this.frame = window.requestAnimationFrame(this.tick);
        };
        ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach((event) => {
            trigger.addEventListener(event, this.handleInteraction);
        });
        this.motion.addEventListener('change', this.handleInteraction);
        this.observer = new MutationObserver(this.handleInteraction);
        this.observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
        if (this.effect === 'confetti') {
            this.container = trigger.closest('.price-heading');
            this.container.prepend(canvas);
            canvas.className = 'token-confetti';
            trigger.classList.add('celebration-confetti');
            this.resizeObserver = new ResizeObserver(() => {
                this.width = Math.round(this.container.getBoundingClientRect().width);
                canvas.width = this.width * 2;
                canvas.height = 460;
            });
            this.resizeObserver.observe(this.container);
        }
    }

    setActive(active) {
        if (active && !this.active) {
            this.startedAt = null;
        }
        this.active = active;
        this.trigger.classList.toggle('is-celebrating', active);
        this.canvas.classList.toggle('is-active', active);
        this.update();
    }

    canAnimate() {
        return (
            !this.destroyed &&
            this.active &&
            this.context &&
            !document.hidden &&
            !this.motion.matches &&
            !this.trigger.matches(':hover, :focus-visible, [aria-expanded="true"]')
        );
    }

    update() {
        if (this.destroyed) {
            return;
        }
        if (this.canAnimate()) {
            if (this.frame === null && this.wakeTimer === null) {
                this.prepare();
                this.lastFrame = 0;
                this.frame = window.requestAnimationFrame(this.tick);
            }
        } else {
            window.cancelAnimationFrame(this.frame);
            window.clearTimeout(this.wakeTimer);
            this.wakeTimer = null;
            this.frame = null;
            this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    prepare() {
        if (this.effect === 'confetti') {
            if (!this.pieces) {
                const colors = ['#d99a25', '#ec718c', '#729bec', '#9b87e5', '#57b9a5'];
                this.pieces = Array.from({ length: 28 }, (_, i) => {
                    const random = (n) => (Math.sin((i + 1) * n) + 1) / 2;
                    return {
                        side: i % 2 ? 1 : -1,
                        speedX: 35 + random(9.3) * 65,
                        speedY: 155 + random(3.7) * 40,
                        delay: random(2.1) * 0.16,
                        spin: random(7.7) * Math.PI * 2,
                        rotation: (2 + random(5.1) * 4) * (i % 3 ? 1 : -1),
                        width: 3 + random(1.8) * 2,
                        height: 6 + random(4.3) * 4,
                        color: colors[i % colors.length],
                        disc: i % 6 === 0,
                    };
                });
            }
            return;
        }
        if (this.field) {
            return;
        }
        this.field = document.createElement('canvas');
        this.field.width = 64;
        this.field.height = 96;
        this.fieldContext = this.field.getContext('2d');
        this.pixels = this.fieldContext.createImageData(64, 96);
        this.noise = new Float32Array(128 * 128);
        this.context.save();
        this.context.scale(2, 2);
        this.glow = this.context.createRadialGradient(48, 99, 2, 48, 91, 43);
        this.glow.addColorStop(0, 'rgba(255, 157, 38, 0.3)');
        this.glow.addColorStop(0.45, 'rgba(255, 100, 20, 0.09)');
        this.glow.addColorStop(1, 'rgba(255, 100, 20, 0)');
        this.context.restore();
        let seed = 721;
        for (let i = 0; i < this.noise.length; i += 1) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            this.noise[i] = seed / 4294967296;
        }
    }

    sample(x, y) {
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        let fx = x - ix;
        let fy = y - iy;
        fx = fx * fx * (3 - 2 * fx);
        fy = fy * fy * (3 - 2 * fy);
        const a = this.noise[((iy & 127) << 7) + (ix & 127)];
        const b = this.noise[((iy & 127) << 7) + ((ix + 1) & 127)];
        const c = this.noise[(((iy + 1) & 127) << 7) + (ix & 127)];
        const d = this.noise[(((iy + 1) & 127) << 7) + ((ix + 1) & 127)];
        return a + (b - a) * fx + (c - a + (a - b - c + d) * fx) * fy;
    }

    renderConfetti(time) {
        if (this.startedAt === null) {
            this.startedAt = time;
        }
        const phase = Math.max(0, time - this.startedAt) % 8;
        const ctx = this.context;
        const width = this.width || this.container.getBoundingClientRect().width;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.scale(2, 2);
        const spread = Math.min(1, Math.max(0.25, (width - 40) / 500));
        for (const piece of this.pieces) {
            const t = phase - piece.delay;
            if (t < 0 || t > 2.7) {
                continue;
            }
            const origin = width * (piece.side < 0 ? 0.28 : 0.72);
            const travel = (1 - Math.exp(-t * 0.9)) / 0.9;
            const x =
                origin +
                piece.side * piece.speedX * travel * spread +
                Math.sin(t * 4 + piece.spin) * t * 3;
            const y = 145 - piece.speedY * t + 82.5 * t * t;
            ctx.save();
            ctx.globalAlpha = Math.min(1, t / 0.08, Math.max(0, (2.7 - t) / 0.65));
            ctx.translate(x, y);
            ctx.rotate(piece.spin + piece.rotation * t);
            ctx.scale(Math.cos(piece.spin + t * 5), 1);
            ctx.fillStyle = piece.color;
            if (piece.disc) {
                ctx.beginPath();
                ctx.arc(0, 0, 2.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
            }
            ctx.restore();
        }
        ctx.restore();
    }

    render(time) {
        const data = this.pixels.data;
        // The 20px logo is centred at (48, 102) in the 96 x 120 CSS canvas.
        for (let y = 0; y < 96; y += 1) {
            const h = (85 - y) / 59;
            const horizontalFalloff = 0.7 + Math.max(0, h) * 0.35 + 0.7 * Math.exp(-h * 8);
            const sway = (this.sample(h * 2, time * 0.65) - 0.5) * 0.55 * Math.max(0, h);
            for (let x = 0; x < 64; x += 1) {
                const offset = (y * 64 + x) * 4;
                const px = (x - 32) / 15 - sway;
                const noise =
                    this.sample(px * 2.1 + 30, h * 3.1 - time * 2.3) * 0.6 +
                    this.sample(px * 4.8 + 60, h * 6.3 - time * 4.1) * 0.3 +
                    this.sample(px * 9.3, h * 11 - time * 6) * 0.1;
                let density =
                    0.95 -
                    h -
                    Math.abs(px) * horizontalFalloff +
                    (noise - 0.5) * (0.7 + Math.max(0, h) * 1.1);
                if (h < 0.12) {
                    // Round the source around the coin rather than clipping it at a flat base.
                    density = Math.min(density, 1 - px * px * 1.2 - ((h - 0.12) / 0.28) ** 2);
                }
                const edge = Math.max(0, Math.min(1, density * 9));
                const base = Math.max(0, Math.min(1, (h + 0.14) * 12));
                const heat = Math.max(0, Math.min(1, density * 1.35));
                data[offset] = 255;
                data[offset + 1] = Math.min(255, 65 + heat * 230);
                data[offset + 2] = Math.max(0, (heat - 0.35) * 290);
                data[offset + 3] = 255 * edge * edge * (3 - 2 * edge) * base;
            }
        }
        this.fieldContext.putImageData(this.pixels, 0, 0);
        const ctx = this.context;
        ctx.clearRect(0, 0, 192, 240);
        ctx.save();
        ctx.scale(2, 2);
        ctx.fillStyle = this.glow;
        ctx.fillRect(0, 40, 96, 80);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this.field, 0, 0, 96, 120);
        // Sparse embers travel with the plume, each with a different lifetime and drift.
        for (let i = 0; i < 5; i += 1) {
            const phase = (time * (0.43 + i * 0.037) + i * 0.217) % 1;
            const x = 48 + Math.sin(i * 7.3) * 11 + Math.sin(phase * 5 + i) * phase * 10;
            const y = 96 - phase * (72 + i * 5);
            ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.85;
            ctx.fillStyle = i % 2 ? '#ffc15d' : '#ff812b';
            ctx.beginPath();
            ctx.ellipse(x, y, 0.7, 1.2, -0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    destroy() {
        this.setActive(false);
        this.destroyed = true;
        this.observer.disconnect();
        this.resizeObserver?.disconnect();
        this.motion.removeEventListener('change', this.handleInteraction);
        ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach((event) => {
            this.trigger.removeEventListener(event, this.handleInteraction);
        });
    }
};

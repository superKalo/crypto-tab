window.App = window.App || {};

window.App.TokenCelebration = class TokenCelebration {
    constructor(canvas, trigger) {
        this.canvas = canvas;
        this.trigger = trigger;
        this.container = canvas.parentElement;
        this.heading = this.container.querySelector('.chart-period');
        this.context = canvas.getContext('2d');
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.active = false;
        this.frame = null;
        this.lastFrame = null;
        this.elapsed = 1;
        this.palette = null;
        this.needsLayout = true;
        this.particles = [];
        this.protectedRects = [];
        this.rocket = null;
        this.destroyed = false;
        this.handleInteraction = () => queueMicrotask(() => this.update());
        this.handleLayoutChange = () => {
            this.needsLayout = true;
            this.update();
        };
        this.handleThemeChange = () => {
            this.palette = null;
            this.handleLayoutChange();
        };
        this.tick = (now) => {
            this.frame = null;
            if (!this.canAnimate()) {
                return;
            }
            if (this.lastFrame === null || now - this.lastFrame >= 1000 / 24) {
                if (this.lastFrame !== null) {
                    this.elapsed += Math.min(now - this.lastFrame, 100) / 1000;
                }
                this.render(this.elapsed);
                this.lastFrame = now;
            }
            this.frame = window.requestAnimationFrame(this.tick);
        };
        ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach((event) => {
            trigger.addEventListener(event, this.handleInteraction);
        });
        this.motion.addEventListener('change', this.handleInteraction);
        window.addEventListener('themechange', this.handleThemeChange);
        this.observer = new MutationObserver(this.handleInteraction);
        this.observer.observe(trigger, { attributes: true, attributeFilter: ['aria-expanded'] });
        this.layoutObserver = new MutationObserver(this.handleLayoutChange);
        this.layoutObserver.observe(this.heading, {
            childList: true,
            characterData: true,
            subtree: true,
        });
        this.resizeObserver = new ResizeObserver(this.handleLayoutChange);
        [
            this.container,
            this.heading,
            document.getElementById('clock'),
            document.getElementById('periods'),
        ].forEach((element) => {
            this.resizeObserver.observe(element);
        });
    }

    setActive(active) {
        if (this.destroyed) {
            return;
        }
        this.active = active;
        this.container.classList.toggle('is-celebrating', active);
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
            this.prepare();
            if (!this.textBounds) {
                return;
            }
            if (this.frame === null) {
                this.lastFrame = null;
                this.frame = window.requestAnimationFrame(this.tick);
            }
        } else {
            window.cancelAnimationFrame(this.frame);
            this.frame = null;
            this.lastFrame = null;
            this.context?.setTransform(1, 0, 0, 1, 0, 0);
            this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getTextRects(element) {
        const rects = [];
        if (!element) {
            return rects;
        }
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        let node;
        while ((node = walker.nextNode())) {
            if (node.textContent.trim()) {
                range.selectNodeContents(node);
                rects.push(...range.getClientRects());
            }
        }
        return rects.filter((rect) => rect.width && rect.height);
    }

    prepare() {
        if (!this.palette) {
            const styles = window.getComputedStyle(this.canvas);
            this.palette = {};
            ['gold', 'lilac', 'pearl', 'ink'].forEach((name) => {
                this.palette[name] = styles.getPropertyValue(`--celebration-${name}`).trim();
            });
        }
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        if (!this.needsLayout && this.ratio === ratio) {
            return;
        }
        const canvasRect = this.canvas.getBoundingClientRect();
        if (!canvasRect.width) {
            return;
        }
        this.width = canvasRect.width;
        this.height = canvasRect.height;
        this.ratio = ratio;
        this.canvas.width = Math.round(this.width * ratio);
        this.canvas.height = Math.round(this.height * ratio);

        const textRects = this.getTextRects(this.heading);
        textRects.push(document.getElementById('price-token-logo').getBoundingClientRect());
        const left = Math.min(...textRects.map((rect) => rect.left)) - canvasRect.left;
        const right = Math.max(...textRects.map((rect) => rect.right)) - canvasRect.left;
        const top = Math.min(...textRects.map((rect) => rect.top)) - canvasRect.top;
        const bottom = Math.max(...textRects.map((rect) => rect.bottom)) - canvasRect.top;
        this.textBounds = { left, right, top, bottom };
        const protectedRects = [
            ...textRects,
            ...this.getTextRects(document.getElementById('clock')),
            ...this.getTextRects(this.container.querySelector('.celebration-demo')),
            ...Array.from(document.querySelectorAll('.js-period'), (button) =>
                button.getBoundingClientRect()
            ),
        ];
        this.protectedRects = protectedRects.map((rect) => ({
            left: rect.left - canvasRect.left,
            right: rect.right - canvasRect.left,
            top: rect.top - canvasRect.top,
            bottom: rect.bottom - canvasRect.top,
        }));

        // Art-directed offsets keep the centre quiet; the two sides differ in shape and timing.
        const positions = [
            [-58, -37, 5.5, 'glint'],
            [-18, -10, 1.8, 'orb'],
            [12, -62, 2.7, 'arc'],
            [36, -36, 3.2, 'seed'],
            [61, -77, 4.5, 'glint'],
            [82, -43, 1.6, 'orb'],
            [104, -55, 2.1, 'seed'],
            [126, -25, 1.3, 'orb'],
            [-35, 12, 2.4, 'seed'],
            [-6, 40, 4.4, 'arc'],
            [27, 24, 2.2, 'orb'],
            [56, 50, 3.2, 'glint'],
            [81, 30, 1.5, 'seed'],
            [110, 19, 1.5, 'orb'],
            [142, -52, 1.2, 'orb'],
            [-8, -89, 1.1, 'orb'],
            [165, -35, 2, 'arc'],
            [155, 45, 1.2, 'orb'],
        ];
        const compact = this.width < 420;
        const spread = Math.min(1, (this.width - 32) / 620);
        const kinds = ['orb', 'arc', 'seed', 'glint'];
        this.particles = [-1, 1].flatMap((side) =>
            positions.slice(0, compact ? 12 : positions.length).map(([x, y, size, kind], index) => {
                const phase = (index + (side === 1 ? 19 : 0)) * 2.39996;
                const offset = side === -1 ? x : x * 0.88 + Math.sin(index * 3.1) * 9;
                return {
                    x: Math.max(
                        14,
                        Math.min(
                            this.width - 14,
                            (side === -1 ? left : right) - side * offset * spread
                        )
                    ),
                    y:
                        (top + bottom) / 2 +
                        y * (side === -1 ? 1 : 0.9) +
                        (side === 1 ? Math.sin(index * 1.7) * 8 : 0),
                    size: size * (compact ? 0.95 : 1.15),
                    kind: side === -1 ? kind : kinds[(index + 2) % kinds.length],
                    color:
                        index === 10 || (index + (side === 1 ? 1 : 0)) % 3 === 0 ? 'gold' : 'lilac',
                    phase,
                    speed: index % 5 === 2 ? 3 : 1,
                    angle: Math.sin(phase) * 1.3,
                };
            })
        );
        this.placeRocket(canvasRect);
        this.needsLayout = false;
    }

    placeRocket(canvasRect) {
        this.rocket = null;
        const comparison = this.heading.querySelector('#change .positive[data-period="ONE_DAY"]');
        if (!comparison) {
            return;
        }
        const rects = this.getTextRects(document.getElementById('change'));
        if (!rects.length) {
            return;
        }
        const right = Math.max(...rects.map((rect) => rect.right)) - canvasRect.left;
        const top = Math.min(...rects.map((rect) => rect.top)) - canvasRect.top;
        const clock = document.getElementById('clock').getBoundingClientRect();
        const scale = this.width < 420 ? 0.76 : 1;
        const rise = this.width < 420 ? 18 : 28;
        const y = top - 42;
        const candidates = [
            right - 18,
            right + 24,
            clock.right - canvasRect.left + 28,
            this.width - 28,
        ];
        for (const candidate of candidates) {
            const x = Math.max(22, Math.min(this.width - 22 * scale - 4, candidate));
            const path = {
                left: x - 16 * scale - 4,
                right: x + 22 * scale + 4,
                top: y - rise - 20 * scale - 3,
                bottom: y + 32 * scale + 3,
            };
            const fits = this.protectedRects.every(
                (rect) =>
                    path.right < rect.left - 4 ||
                    path.left > rect.right + 4 ||
                    path.bottom < rect.top - 4 ||
                    path.top > rect.bottom + 4
            );
            if (fits && path.top >= 0) {
                this.rocket = { x, y, scale, rise };
                return;
            }
        }
    }

    color(name, opacity) {
        return `rgba(${this.palette[name]}, ${opacity})`;
    }

    clearance(x, y, radius) {
        return this.protectedRects.reduce((opacity, rect) => {
            const dx = Math.max(rect.left - x, 0, x - rect.right);
            const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            return Math.min(opacity, Math.max(0, (Math.hypot(dx, dy) - radius - 5) / 9));
        }, 1);
    }

    renderParticle(particle, angle) {
        const ctx = this.context;
        const phase = angle * particle.speed + particle.phase;
        const x = particle.x + Math.sin(phase) * 3.6 + Math.cos(phase * 2) * 0.8;
        const y = particle.y + Math.sin(angle + particle.phase * 1.3) * 4.8;
        const size = particle.size * (0.94 + Math.sin(phase * 2) * 0.08);
        const opacity = (0.58 + Math.sin(phase * 2) * 0.14) * this.clearance(x, y, size + 2);
        if (opacity <= 0) {
            return;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(particle.angle + Math.sin(phase) * 0.16);
        ctx.lineWidth = 0.85;
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.color(particle.color, opacity);
        ctx.shadowColor = this.color(particle.color, opacity * 0.7);
        ctx.shadowBlur = 7;
        ctx.beginPath();
        if (particle.kind === 'orb') {
            const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 4);
            glow.addColorStop(0, this.color(particle.color, opacity * 0.6));
            glow.addColorStop(0.4, this.color(particle.color, opacity * 0.18));
            glow.addColorStop(1, this.color(particle.color, 0));
            ctx.fillStyle = glow;
            ctx.arc(0, 0, size * 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = this.color('pearl', opacity * 0.95);
            ctx.arc(0, 0, Math.max(0.6, size * 0.42), 0, Math.PI * 2);
            ctx.fill();
        } else if (particle.kind === 'glint') {
            // Unequal, slightly bent strokes avoid a repeated stock star silhouette.
            ctx.moveTo(-size, size * 0.18);
            ctx.bezierCurveTo(
                -size * 0.25,
                size * 0.04,
                size * 0.1,
                -size * 0.05,
                size * 0.8,
                -size * 0.28
            );
            ctx.moveTo(-size * 0.18, -size * 0.95);
            ctx.bezierCurveTo(
                -size * 0.04,
                -size * 0.2,
                size * 0.02,
                size * 0.12,
                size * 0.24,
                size * 0.65
            );
            ctx.stroke();
        } else if (particle.kind === 'seed') {
            ctx.moveTo(-size * 0.4, -size * 0.45);
            ctx.bezierCurveTo(
                -size * 0.95,
                size * 0.35,
                size * 0.1,
                size * 0.8,
                size * 0.65,
                size * 0.15
            );
            ctx.bezierCurveTo(
                size * 0.9,
                -size * 0.35,
                size * 0.3,
                -size * 0.7,
                -size * 0.1,
                -size * 0.5
            );
            ctx.stroke();
        } else {
            ctx.moveTo(-size * 0.9, size * 0.2);
            ctx.bezierCurveTo(
                -size * 0.2,
                -size * 0.8,
                size * 0.7,
                -size * 0.55,
                size * 0.55,
                size * 0.25
            );
            ctx.stroke();
        }
        ctx.restore();
    }

    renderMeteors(time) {
        const ctx = this.context;
        const { left, right, top } = this.textBounds;
        const paths = [
            { x: left - 28, y: top - 64, dx: 55, dy: 32, offset: 0.6, color: 'gold' },
            { x: right + 20, y: top - 77, dx: -50, dy: 33, offset: 3.2, color: 'lilac' },
            { x: right - 56, y: top - 46, dx: 48, dy: -25, offset: 6.1, color: 'gold' },
        ];
        paths.forEach((path) => {
            const age = (time - path.offset + 16) % 8;
            if (age > 1.35) {
                return;
            }
            const phase = age / 1.35;
            const x = path.x + path.dx * phase;
            const y = path.y + path.dy * phase;
            const visibility = Math.pow(Math.sin(phase * Math.PI), 0.7) * 0.85;
            const length = Math.hypot(path.dx, path.dy);
            const tailX = (path.dx / length) * 16;
            const tailY = (path.dy / length) * 16;
            ctx.save();
            ctx.lineCap = 'round';
            ctx.shadowColor = this.color(path.color, 0.4);
            ctx.shadowBlur = 5;
            for (let i = 1; i <= 8; i += 1) {
                const trail = i / 8;
                const px = x - tailX * (1 - trail);
                const py = y - tailY * (1 - trail);
                const opacity = visibility * trail * trail * this.clearance(px, py, 3);
                ctx.strokeStyle = this.color(path.color, opacity);
                ctx.lineWidth = 0.3 + trail * 0.9;
                ctx.beginPath();
                ctx.moveTo(x - tailX * (1 - (i - 1) / 8), y - tailY * (1 - (i - 1) / 8));
                ctx.lineTo(px, py);
                ctx.stroke();
            }
            ctx.fillStyle = this.color(path.color, visibility * this.clearance(x, y, 3));
            ctx.beginPath();
            ctx.arc(x, y, 1.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }

    renderRocket(time) {
        if (!this.rocket) {
            return;
        }
        const ctx = this.context;
        const { x, y, scale, rise } = this.rocket;
        const phase = time / 16;
        const opacity = Math.min(1, phase / 0.06, (1 - phase) / 0.08);
        const flicker = Math.sin(time * Math.PI * 10) * 0.65 + Math.sin(time * Math.PI * 16) * 0.35;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(
            x + (phase * 8 + Math.sin(phase * Math.PI * 2) * 1.6) * scale,
            y - phase * rise + Math.sin(phase * Math.PI * 2) * 0.7
        );
        ctx.scale(scale, scale);
        ctx.rotate(0.34 + Math.sin(phase * Math.PI * 2) * 0.035);

        // A quick, changing exhaust underneath a deliberately unhurried little craft.
        const exhaust = ctx.createLinearGradient(0, 12, 0, 33);
        exhaust.addColorStop(0, this.color('pearl', 0.95));
        exhaust.addColorStop(0.35, this.color('gold', 0.9));
        exhaust.addColorStop(1, this.color('gold', 0));
        ctx.fillStyle = exhaust;
        ctx.shadowColor = this.color('gold', 0.55);
        ctx.shadowBlur = 7;
        ctx.beginPath();
        ctx.moveTo(-3, 11);
        ctx.bezierCurveTo(-4.8, 17, -2.5, 21, flicker * 1.5, 29 + flicker * 4);
        ctx.bezierCurveTo(1.4, 22, 5, 17 + flicker, 3, 11);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.color('pearl', 0.95);
        ctx.beginPath();
        ctx.moveTo(-1.6, 11);
        ctx.quadraticCurveTo(-2, 17, flicker * 0.6, 23 + flicker * 2);
        ctx.quadraticCurveTo(2.4, 17, 1.6, 11);
        ctx.fill();

        // Unequal swept fins and an offset oval window give this capsule its own silhouette.
        ctx.lineWidth = 0.8;
        ctx.lineJoin = 'round';
        ctx.strokeStyle = this.color('ink', 0.7);
        ctx.fillStyle = this.color('lilac', 0.85);
        ctx.beginPath();
        ctx.moveTo(-6, -1);
        ctx.bezierCurveTo(-10, 2, -14.5, 8, -13, 12);
        ctx.quadraticCurveTo(-8, 8, -4, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(6, 3);
        ctx.quadraticCurveTo(12.5, 6, 9, 12.5);
        ctx.lineTo(3.5, 9);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        const shell = ctx.createLinearGradient(-8, 0, 8, 0);
        shell.addColorStop(0, this.color('gold', 0.75));
        shell.addColorStop(0.38, this.color('pearl', 1));
        shell.addColorStop(1, this.color('pearl', 1));
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.bezierCurveTo(5, -15, 9, -8, 8, 0);
        ctx.bezierCurveTo(7.5, 8, 3.5, 13, -1.5, 12);
        ctx.bezierCurveTo(-6, 11, -8, 6, -7, -1);
        ctx.bezierCurveTo(-6, -8, -4, -14, 0, -18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = this.color('gold', 0.7);
        ctx.beginPath();
        ctx.moveTo(-4.8, -7.8);
        ctx.quadraticCurveTo(0, -9.5, 5.8, -6.8);
        ctx.stroke();
        ctx.fillStyle = this.color('ink', 0.95);
        ctx.beginPath();
        ctx.ellipse(1.4, -2.7, 2.8, 3.8, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color('pearl', 0.85);
        ctx.beginPath();
        ctx.ellipse(0.7, -4.1, 0.8, 1.3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = this.color('ink', 0.55);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-3, 10.6);
        ctx.quadraticCurveTo(0, 12, 3.2, 10.2);
        ctx.stroke();
        ctx.restore();
    }

    render(time) {
        const ctx = this.context;
        ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        const loopTime = time % 16;
        const angle = (loopTime * Math.PI * 2) / 16;
        this.particles.forEach((particle) => this.renderParticle(particle, angle));
        this.renderMeteors(loopTime);
        this.renderRocket(loopTime);
    }

    destroy() {
        this.setActive(false);
        this.destroyed = true;
        this.observer.disconnect();
        this.layoutObserver.disconnect();
        this.resizeObserver.disconnect();
        this.motion.removeEventListener('change', this.handleInteraction);
        window.removeEventListener('themechange', this.handleThemeChange);
        ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach((event) => {
            this.trigger.removeEventListener(event, this.handleInteraction);
        });
    }
};

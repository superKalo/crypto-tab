window.App = window.App || {};

const CELEBRATION_FLIGHT = { kickSeconds: 0.24, approachSeconds: 8, passSeconds: 4.5 };
const CELEBRATION_PREVIEW_SECONDS =
    CELEBRATION_FLIGHT.kickSeconds +
    CELEBRATION_FLIGHT.approachSeconds +
    CELEBRATION_FLIGHT.passSeconds +
    1;

window.App.TokenCelebration = class TokenCelebration {
    constructor(canvas, trigger) {
        this.canvas = canvas;
        this.trigger = trigger;
        this.container = canvas.parentElement;
        this.rocketTarget = document.querySelector('.celebration-rocket-target');
        const rocketTip = this.rocketTarget.querySelector('.celebration-rocket-tip');
        this.rocketTipTitle = rocketTip.querySelector('.update-details-title');
        this.rocketTipDescription = rocketTip.querySelector('.update-details-description');
        this.rocketTipWidth = 0;
        this.heading = this.container.querySelector('.chart-period');
        this.price = document.getElementById('price-now');
        this.context = canvas.getContext('2d');
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.active = false;
        this.frame = null;
        this.lastFrame = null;
        this.elapsed = 0;
        this.previewElapsed = null;
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
                const delta =
                    this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, 100) / 1000;
                if (this.previewElapsed === null) {
                    this.elapsed += delta;
                    this.render(this.elapsed);
                } else {
                    this.previewElapsed += delta;
                    if (this.previewElapsed >= CELEBRATION_PREVIEW_SECONDS) {
                        this.setPreview(false);
                        return;
                    }
                    this.render(this.previewElapsed);
                }
                this.lastFrame = now;
            }
            this.frame = window.requestAnimationFrame(this.tick);
        };
        ['focusin', 'focusout'].forEach((event) => {
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
        this.resizeObserver = new ResizeObserver((entries) => {
            this.rocketTipWidth = rocketTip.offsetWidth;
            if (entries.some(({ target }) => target !== rocketTip)) {
                this.handleLayoutChange();
            }
        });
        [
            this.container,
            this.heading,
            document.getElementById('clock'),
            document.getElementById('periods'),
            rocketTip,
        ].forEach((element) => {
            this.resizeObserver.observe(element);
        });
    }

    setActive(active) {
        if (this.destroyed) {
            return;
        }
        this.active = active;
        this.update();
    }

    setPreview(active) {
        if (this.destroyed || (active && (!this.context || this.motion.matches))) {
            return false;
        }
        if (!active && this.previewElapsed === null) {
            return false;
        }

        this.previewElapsed = active ? 0 : null;
        this.rocketTipTitle.textContent = App.I18n.t(
            active ? 'celebration.previewTitle' : 'celebration.activated'
        );
        this.rocketTipDescription.classList.toggle('hidden', active);
        this.needsLayout = true;
        this.lastFrame = null;
        this.update();
        return true;
    }

    canAnimate() {
        return (
            !this.destroyed &&
            (this.active || this.previewElapsed !== null) &&
            this.context &&
            !document.hidden &&
            !this.motion.matches &&
            this.container.getAttribute('aria-busy') !== 'true' &&
            !this.trigger.matches(':focus-visible, [aria-expanded="true"]')
        );
    }

    update() {
        if (this.destroyed) {
            return;
        }
        this.container.classList.toggle(
            'is-celebrating',
            this.active || this.previewElapsed !== null
        );
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
            this.rocketTarget.hidden = true;
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
            ['gold', 'lilac', 'pearl', 'ink', 'shell'].forEach((name) => {
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
            [-18, -10, 1.8, 'confetti'],
            [12, -62, 2.7, 'arc'],
            [36, -36, 3.2, 'seed'],
            [61, -77, 4.5, 'glint'],
            [82, -43, 1.6, 'confetti'],
            [104, -55, 2.1, 'seed'],
            [126, -25, 1.3, 'confetti'],
            [-35, 12, 2.4, 'seed'],
            [-6, 40, 4.4, 'arc'],
            [27, 24, 2.2, 'confetti'],
            [56, 50, 3.2, 'glint'],
            [81, 30, 1.5, 'seed'],
            [110, 19, 1.5, 'confetti'],
            [142, -52, 1.2, 'confetti'],
            [-8, -89, 1.1, 'confetti'],
            [165, -35, 2, 'arc'],
            [155, 45, 1.2, 'confetti'],
        ];
        const compact = this.width < 420;
        const spread = Math.min(1.1, (this.width - 32) / 580);
        const kinds = ['confetti', 'arc', 'seed', 'glint'];
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
                        y * (side === -1 ? 1.1 : 1) +
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

    getGainAnchor() {
        const comparison = this.heading.querySelector('#change .positive[data-period="ONE_DAY"]');
        const text = comparison?.firstChild;
        const firstDigit = text?.textContent.match(/\p{Decimal_Number}/u);
        if (!firstDigit) {
            return null;
        }
        const digitRange = document.createRange();
        digitRange.setStart(text, firstDigit.index);
        digitRange.setEnd(text, firstDigit.index + firstDigit[0].length);
        const digit = digitRange.getBoundingClientRect();
        return digit.width && digit.height ? digit : null;
    }

    placeRocket(canvasRect) {
        this.rocket = null;
        const anchor =
            this.getGainAnchor() ??
            (this.previewElapsed !== null ? this.price.getBoundingClientRect() : null);
        if (!anchor?.width || !anchor.height) {
            return;
        }
        const clock = document.getElementById('clock').getBoundingClientRect();
        const scale = this.width < 420 ? 0.76 : 1;
        const origin = (anchor.left + anchor.right) / 2 - canvasRect.left;
        const x = Math.max(20 * scale, Math.min(this.width - 40 * scale, origin + 22 * scale));
        const y = anchor.top - canvasRect.top - 13 * scale;
        const endX = Math.min(
            this.width - 24 * scale,
            Math.max(x + 44 * scale, clock.right - canvasRect.left + 14 * scale)
        );
        const clockTop = clock.top - canvasRect.top;
        const endY = Math.max(22 * scale, clockTop - 28 * scale);
        const rise = Math.max(44 * scale, y - endY);
        const drift = endX - x;
        const moonOffset = (48 * scale) / Math.hypot(drift, rise);
        const moon = {
            x: Math.min(this.width - 22 * scale, endX + drift * moonOffset),
            y: Math.max(22 * scale, y - rise * (1 + moonOffset) - 20 * scale),
        };
        this.rocket = {
            x,
            y,
            scale,
            rise,
            drift,
            clockTop,
            clockEntry: Math.max(
                10 * scale,
                Math.min(rise * 0.45, y + canvasRect.top - clock.bottom)
            ),
            moon,
            stars: [
                [-36, 11, 5.6, 'glint', 'lilac'],
                [30, -5, 4.7, 'glint', 'gold'],
                [-18, -16, 2.2, 'confetti', 'gold'],
                [45, 21, 2, 'confetti', 'lilac'],
                [-51, 39, 3.1, 'seed', 'gold'],
                [26, 44, 3.4, 'arc', 'lilac'],
                [-26, 56, 3.9, 'glint', 'gold'],
                [47, 57, 1.8, 'confetti', 'gold'],
            ].map(([dx, dy, size, kind, color], index) => ({
                x: moon.x + dx * scale,
                y: moon.y + dy * scale,
                size: size * scale,
                kind,
                color,
                phase: index * 2.4,
                speed: 2,
                angle: Math.sin(index * 2.4) * 0.7,
            })),
        };
    }

    getRocketPose(rocket, time) {
        const { x, y, scale, drift, rise, clockEntry } = rocket;
        const { kickSeconds, approachSeconds, passSeconds } = CELEBRATION_FLIGHT;
        const kickDistance = 7 * scale;
        const approachSpeed = (clockEntry - kickDistance) / approachSeconds;
        const kick = Math.min(1, time / kickSeconds);
        const approach = Math.max(0, Math.min(1, (time - kickSeconds) / approachSeconds));
        const pass = Math.max(0, Math.min(1, (time - kickSeconds - approachSeconds) / passSeconds));
        // Match the speed at both joins so the brief kick blends into the slow climb and fast pass.
        const launch =
            kickDistance * kick + (kickDistance - approachSpeed * kickSeconds) * kick * (1 - kick);
        const distance =
            launch +
            (clockEntry - kickDistance) * approach +
            (rise - clockEntry) * pass ** 2 * (3 - 2 * pass) +
            approachSpeed * passSeconds * pass * (1 - pass) ** 2;
        const progress = distance / rise;
        const launchDrift = drift * 0.8;
        const horizontalDistance =
            2 * launchDrift * progress * (1 - progress) + drift * progress ** 2;
        const horizontalSlope =
            2 * (launchDrift * (1 - progress) + (drift - launchDrift) * progress);
        return {
            x: x + horizontalDistance,
            y: y - progress * rise,
            angle: Math.atan2(horizontalSlope, rise),
        };
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

    renderParticle(particle, angle, visibility = 1) {
        const ctx = this.context;
        const phase = angle * particle.speed + particle.phase;
        const x = particle.x + Math.sin(phase) * 3.6 + Math.cos(phase * 2) * 0.8;
        const y = particle.y + Math.sin(angle + particle.phase * 1.3) * 4.8;
        const size = particle.size * (0.94 + Math.sin(phase * 2) * 0.08);
        const opacity =
            visibility * (0.58 + Math.sin(phase * 2) * 0.14) * this.clearance(x, y, size + 2);
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
        if (particle.kind === 'confetti') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = this.color(particle.color, opacity * 0.85);
            if (Math.sin(particle.phase) > 0) {
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.55, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.55, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-size, -0.5, size * 2, 1);
            }
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

    renderLaunchConfetti(rocket, time, shake) {
        const age = time / 1.25;
        if (age >= 1) {
            return;
        }
        const ctx = this.context;
        const { scale } = rocket;
        const launch = this.getRocketPose(rocket, 0);
        const flameX = launch.x - Math.sin(launch.angle) * 24 * scale;
        const flameY = launch.y + Math.cos(launch.angle) * 24 * scale;
        const spread = 1 - (1 - age) ** 3;
        const fade = Math.min(1, time / 0.09) * (1 - age) ** 1.5;
        const pieces = [
            [-60, -19, 3.5],
            [-49, -35, 4.6],
            [-33, -22, 2.8],
            [-25, -47, 4.1],
            [-8, -32, 3],
            [7, -51, 4.4],
            [24, -35, 3.2],
            [39, -44, 4.5],
            [48, -24, 3.4],
            [66, -20, 4],
            [71, -34, 2.7],
            [-42, -53, 3.5],
            [30, -61, 3.8],
            [58, -46, 3.1],
        ];
        const colors = ['#f8c34e', '#fa7199', '#64d5c3', '#ad85f5', '#71b9ff'];
        pieces.forEach(([dx, dy, length], index) => {
            const px = flameX + dx * spread * scale;
            const py = flameY + (dy * spread + 12 * age ** 2) * scale;
            const abovePrice = Math.min(1, (launch.y + 13 * scale - py) / (9 * scale));
            const opacity = fade * abovePrice;
            if (opacity <= 0) {
                return;
            }
            ctx.save();
            ctx.translate(px + shake * (1 - age), py);
            ctx.rotate(index * 2.4 + age * (index % 2 ? -3 : 3));
            ctx.globalAlpha = opacity;
            const color = colors[index % colors.length];
            const size = length * scale;
            if (index % 3 === 0) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.4 * scale;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.bezierCurveTo(-size / 2, -size, size / 2, size, size, 0);
                ctx.stroke();
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(-size / 2, -scale, size, 2 * scale);
            }
            ctx.restore();
        });
    }

    renderMoon(rocket, pose, angle) {
        const { scale, moon, clockTop, stars } = rocket;
        const noseY = pose.y - Math.cos(pose.angle) * 18 * scale;
        const starlight = Math.min(1, (clockTop + 20 * scale - noseY) / (36 * scale));
        if (starlight > 0) {
            stars.forEach((star) => this.renderParticle(star, angle, starlight));
        }
        const reveal = Math.max(0, Math.min(1, (clockTop - noseY) / (24 * scale)));
        if (reveal === 0) {
            return;
        }
        const ctx = this.context;
        const opacity = reveal * reveal * (3 - 2 * reveal);
        const size = scale * (0.86 + opacity * 0.14);
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(moon.x, moon.y);
        ctx.scale(-size, size);
        const light = ctx.createRadialGradient(-5, -6, 1, 0, 0, 13);
        light.addColorStop(0, this.color('pearl', 1));
        light.addColorStop(0.58, this.color('pearl', 1));
        light.addColorStop(1, this.color('gold', 0.82));
        ctx.fillStyle = light;
        ctx.strokeStyle = this.color('gold', 0.72);
        ctx.lineWidth = 0.7;
        ctx.shadowColor = this.color('gold', 0.48);
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 0, 13, Math.PI / 3, -Math.PI / 3);
        const tipY = 13 * Math.sin(Math.PI / 3);
        ctx.bezierCurveTo(-11, -8, -11, 8, 6.5, tipY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.clip();
        ctx.shadowBlur = 0;
        ctx.fillStyle = this.color('ink', 0.23);
        for (const [x, y, rx, ry] of [
            [-4, -3, 2.7, 2],
            [4, 3, 3.1, 2.3],
            [-3, 6, 1.4, 1.1],
        ]) {
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, -0.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    renderRocket(time, angle) {
        if (!this.rocket) {
            this.rocketTarget.hidden = true;
            return;
        }
        const ctx = this.context;
        const { scale } = this.rocket;
        const flightTime = this.previewElapsed === null ? time / 3 : time;
        const pose = this.getRocketPose(this.rocket, flightTime);
        const shake = 3.5 * Math.sin(time * Math.PI * 16) * Math.max(0, 1 - time / 0.5) ** 2;
        const rocketX = pose.x + shake * scale;
        const canvasRect = this.canvas.getBoundingClientRect();
        const targetX = canvasRect.left + rocketX;
        const targetY = canvasRect.top + pose.y;
        const viewportWidth = document.documentElement.clientWidth;
        const tipInset = Math.min(this.rocketTipWidth / 2 + 8, viewportWidth / 2);
        const tipCenter = Math.max(tipInset, Math.min(viewportWidth - tipInset, targetX));
        this.rocketTarget.style.setProperty('--rocket-tip-offset', `${tipCenter - targetX}px`);
        this.rocketTarget.classList.toggle(
            'tooltip-beside',
            viewportWidth - targetX >= this.rocketTipWidth + 40
        );
        this.rocketTarget.hidden = time < 0.2;
        this.rocketTarget.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
        this.renderLaunchConfetti(this.rocket, time, shake * scale);
        this.renderMoon(this.rocket, pose, angle);
        const fade = Math.min(1, time / 0.2);
        const opacity = fade * fade * (3 - 2 * fade);
        const flicker = Math.sin(time * Math.PI * 10) * 0.65 + Math.sin(time * Math.PI * 16) * 0.35;
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(rocketX, pose.y);
        ctx.scale(scale, scale);
        ctx.rotate(pose.angle);

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
        shell.addColorStop(0.38, this.color('shell', 1));
        shell.addColorStop(1, this.color('shell', 1));
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
        ctx.strokeStyle = this.color('gold', 0.58);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(-4.7, -10.4);
        ctx.quadraticCurveTo(0.9, -12, 6.5, -10.4);
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
        this.renderRocket(time, angle);
    }

    destroy() {
        this.setActive(false);
        this.setPreview(false);
        this.destroyed = true;
        this.observer.disconnect();
        this.layoutObserver.disconnect();
        this.resizeObserver.disconnect();
        this.motion.removeEventListener('change', this.handleInteraction);
        window.removeEventListener('themechange', this.handleThemeChange);
        ['focusin', 'focusout'].forEach((event) => {
            this.trigger.removeEventListener(event, this.handleInteraction);
        });
    }
};

window.App = window.App || {};

const CELEBRATION_FLIGHT = { kickSeconds: 0.24, approachSeconds: 8, passSeconds: 4.5 };
const CELEBRATION_FLIGHT_SECONDS =
    CELEBRATION_FLIGHT.kickSeconds +
    CELEBRATION_FLIGHT.approachSeconds +
    CELEBRATION_FLIGHT.passSeconds;
// The live celebration climbs at a third of the preview's pace.
const CELEBRATION_LIVE_PACE = 1 / 3;
const CELEBRATION_ARRIVAL_SECONDS = 1.6;
const CELEBRATION_PREVIEW_SECONDS = CELEBRATION_FLIGHT_SECONDS + CELEBRATION_ARRIVAL_SECONDS + 0.8;
// Calm motion runs at 30 fps, an even divisor of 60 and 120 Hz displays; fast moments such
// as the launch, the sprinkle, a shooting star or the arrival run at 60 fps.
const CELEBRATION_CALM_FRAME_MS = 1000 / 30;
const CELEBRATION_LIVELY_FRAME_MS = 1000 / 60;
const CELEBRATION_LAUNCH_SECONDS = 6.6;
// Caps the full-viewport backing store, about a 1440x900 viewport at 1.75x.
const CELEBRATION_MAX_BACKING_PIXELS = 4000000;
// The rocket's stage keeps its original art direction: a band around the price sentence.
const CELEBRATION_STAGE = { above: 264, height: 380 };
// A slightly larger moon reads as the destination from the very first frame.
const CELEBRATION_MOON_SIZE = 1.3;

/**
 * Celebration Mode: a rocket that launches from the gain towards a waiting moon, sparkles
 * around the price, and a page-wide confetti layer. Everything draws into one viewport-sized
 * canvas behind the content, on one frame loop, so the scene shares a single cadence.
 */
window.App.TokenCelebration = class TokenCelebration {
    constructor(canvas, trigger, container) {
        this.canvas = canvas;
        this.trigger = trigger;
        this.container = container;
        this.rocketTarget = document.querySelector('.celebration-rocket-target');
        const rocketTip = this.rocketTarget.querySelector('.celebration-rocket-tip');
        this.rocketTipTitle = rocketTip.querySelector('.update-details-title');
        this.rocketTipDescription = rocketTip.querySelector('.update-details-description');
        this.rocketTipWidth = 0;
        this.heading = this.container.querySelector('.chart-period');
        this.price = document.getElementById('price-now');
        this.clock = document.getElementById('clock');
        this.context = canvas?.getContext('2d') ?? null;
        this.ambience = new App.CelebrationAmbience();
        this.sprites = null;
        this.motion = window.matchMedia('(prefers-reduced-motion: reduce)');
        this.active = false;
        this.demo = false;
        this.frame = null;
        this.frameTimer = null;
        this.tickStartedAt = 0;
        this.lastFrame = null;
        this.lively = true;
        this.elapsed = 0;
        this.previewElapsed = null;
        this.palette = null;
        this.needsLayout = true;
        this.width = 0;
        this.height = 0;
        this.ratio = 1;
        this.origin = { left: 0, top: 0 };
        this.particles = [];
        this.protectedRects = [];
        this.textBounds = null;
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
        // The canvas is fixed to the viewport, so scrolling moves the text it works around.
        this.handleScroll = () => {
            this.needsLayout = true;
        };
        this.tick = (now) => {
            this.frame = null;
            this.tickStartedAt = performance.now();
            if (!this.canAnimate()) {
                return;
            }
            if (this.needsLayout) {
                this.prepare();
            }
            // The timer sets the cadence; the delta keeps motion speed independent of jitter.
            const delta = this.lastFrame === null ? 0 : Math.min(now - this.lastFrame, 100) / 1000;
            this.lastFrame = now;
            if (this.previewElapsed === null) {
                this.elapsed += delta;
                this.render(this.elapsed, CELEBRATION_LIVE_PACE);
            } else {
                this.previewElapsed += delta;
                if (this.previewElapsed >= CELEBRATION_PREVIEW_SECONDS) {
                    this.setPreview(false);
                    return;
                }
                this.render(this.previewElapsed, 1);
            }
            this.scheduleFrame();
        };
        ['focusin', 'focusout'].forEach((event) => {
            trigger.addEventListener(event, this.handleInteraction);
        });
        this.motion.addEventListener('change', this.handleInteraction);
        window.addEventListener('themechange', this.handleThemeChange);
        window.addEventListener('resize', this.handleLayoutChange);
        window.addEventListener('scroll', this.handleScroll, { passive: true });
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
            this.clock,
            document.getElementById('periods'),
            rocketTip,
        ].forEach((element) => {
            this.resizeObserver.observe(element);
        });
    }

    static ease(value) {
        const t = Math.max(0, Math.min(1, value));
        return t * t * (3 - 2 * t);
    }

    setActive(active) {
        if (this.destroyed) {
            return;
        }
        this.active = active;
        this.update();
    }

    // A demo runs the live celebration without a qualifying gain, so it says so.
    setDemo(demo) {
        if (this.destroyed || this.demo === demo) {
            return;
        }
        this.demo = demo;
        this.updateTip();
    }

    setPreview(active) {
        if (this.destroyed || (active && (!this.context || this.motion.matches))) {
            return false;
        }
        if (!active && this.previewElapsed === null) {
            return false;
        }

        this.previewElapsed = active ? 0 : null;
        this.updateTip();
        this.needsLayout = true;
        this.lastFrame = null;
        this.update();
        return true;
    }

    updateTip() {
        const isPreview = this.previewElapsed !== null;
        this.rocketTipTitle.textContent = App.I18n.t(
            isPreview || this.demo ? 'celebration.previewTitle' : 'celebration.activated'
        );
        this.rocketTipDescription.classList.toggle('hidden', isPreview);
    }

    scheduleFrame() {
        // Requesting every vsync makes the browser produce a frame each time, up to 120 per
        // second; waiting out the interval first keeps frame production at the drawn rate.
        // Frame timestamps can trail the clock, so time the wait from when the callback ran.
        const interval = this.lively ? CELEBRATION_LIVELY_FRAME_MS : CELEBRATION_CALM_FRAME_MS;
        const wait = Math.max(0, interval - (performance.now() - this.tickStartedAt) - 4);
        this.frameTimer = window.setTimeout(() => {
            this.frameTimer = null;
            this.frame = window.requestAnimationFrame(this.tick);
        }, wait);
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
        this.canvas?.classList.toggle('is-visible', this.active || this.previewElapsed !== null);
        if (this.canAnimate()) {
            this.prepare();
            if (!this.textBounds) {
                return;
            }
            if (this.frame === null && this.frameTimer === null) {
                this.lastFrame = null;
                this.frame = window.requestAnimationFrame(this.tick);
            }
        } else {
            this.rocketTarget.hidden = true;
            window.cancelAnimationFrame(this.frame);
            window.clearTimeout(this.frameTimer);
            this.frame = null;
            this.frameTimer = null;
            this.lastFrame = null;
            // Release the full-viewport backing store while nothing is drawn.
            if (this.canvas?.width) {
                this.canvas.width = 0;
                this.canvas.height = 0;
            }
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
        if (!this.context) {
            return;
        }
        if (!this.palette) {
            const styles = window.getComputedStyle(this.canvas);
            this.palette = {};
            ['gold', 'lilac', 'pearl', 'ink', 'shell'].forEach((name) => {
                this.palette[name] = styles.getPropertyValue(`--celebration-${name}`).trim();
            });
            this.sprites = null;
        }
        const canvasRect = this.canvas.getBoundingClientRect();
        if (!canvasRect.width || !canvasRect.height) {
            return;
        }
        const ratio = Math.max(
            0.75,
            Math.min(
                window.devicePixelRatio || 1,
                2,
                Math.sqrt(CELEBRATION_MAX_BACKING_PIXELS / (canvasRect.width * canvasRect.height))
            )
        );
        if (!this.needsLayout && this.sprites && this.ratio === ratio) {
            return;
        }
        this.width = canvasRect.width;
        this.height = canvasRect.height;
        this.ratio = ratio;
        this.origin = { left: canvasRect.left, top: canvasRect.top };
        this.rocketTargetPlacement = null;
        if (!this.sprites || this.sprites.ratio !== ratio) {
            this.sprites = new App.CelebrationSprites(this.palette, ratio);
        }
        const toCanvas = ({ left, right, top, bottom }) => ({
            left: left - canvasRect.left,
            right: right - canvasRect.left,
            top: top - canvasRect.top,
            bottom: bottom - canvasRect.top,
        });

        const container = toCanvas(this.container.getBoundingClientRect());
        this.stage = {
            left: container.left,
            right: container.right,
            top: container.top - CELEBRATION_STAGE.above,
            width: container.right - container.left,
        };
        const textRects = this.getTextRects(this.heading);
        textRects.push(document.getElementById('price-token-logo').getBoundingClientRect());
        const text = textRects.map(toCanvas);
        const left = Math.min(...text.map((rect) => rect.left));
        const right = Math.max(...text.map((rect) => rect.right));
        const top = Math.min(...text.map((rect) => rect.top));
        const bottom = Math.max(...text.map((rect) => rect.bottom));
        this.textBounds = { left, right, top, bottom };
        this.protectedRects = [
            ...text,
            ...this.getTextRects(this.clock).map(toCanvas),
            ...Array.from(document.querySelectorAll('.js-period'), (button) =>
                toCanvas(button.getBoundingClientRect())
            ),
        ];
        this.ambience.layout({
            width: this.width,
            height: this.height,
            palette: this.palette,
            quietRects: [
                ...this.protectedRects,
                ...this.getTextRects(document.getElementById('last-updated')).map(toCanvas),
                ...this.getTextRects(document.querySelector('.website-header')).map(toCanvas),
                ...Array.from(document.querySelectorAll('.footer-action, .install__link'), (el) =>
                    toCanvas(el.getBoundingClientRect())
                ),
            ],
            dimRects: [toCanvas(document.getElementById('chart').getBoundingClientRect())],
        });

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
        const compact = this.stage.width < 420;
        const spread = Math.min(1.1, (this.stage.width - 32) / 580);
        const kinds = ['confetti', 'arc', 'seed', 'glint'];
        this.particles = [-1, 1].flatMap((side) =>
            positions.slice(0, compact ? 12 : positions.length).map(([x, y, size, kind], index) => {
                const phase = (index + (side === 1 ? 19 : 0)) * 2.39996;
                const offset = side === -1 ? x : x * 0.88 + Math.sin(index * 3.1) * 9;
                return {
                    x: Math.max(
                        this.stage.left + 14,
                        Math.min(
                            this.stage.right - 14,
                            (side === -1 ? left : right) - side * offset * spread
                        )
                    ),
                    y:
                        (top + bottom) / 2 +
                        y * (side === -1 ? 1.1 : 1) +
                        (side === 1 ? Math.sin(index * 1.7) * 8 : 0),
                    size: size * (compact ? 0.95 : 1.15),
                    kind: side === -1 ? kind : kinds[(index + 2) % kinds.length],
                    variant: Math.sin(phase) > 0,
                    color:
                        index === 10 || (index + (side === 1 ? 1 : 0)) % 3 === 0 ? 'gold' : 'lilac',
                    phase,
                    speed: index % 5 === 2 ? 3 : 1,
                    angle: Math.sin(phase) * 1.3,
                };
            })
        );
        this.placeRocket(toCanvas);
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

    placeRocket(toCanvas) {
        this.rocket = null;
        // Launch from the 24h gain when it is shown; otherwise from the price itself.
        const anchorRect = this.getGainAnchor() ?? this.price.getBoundingClientRect();
        if (!anchorRect.width || !anchorRect.height) {
            return;
        }
        const anchor = toCanvas(anchorRect);
        const clock = toCanvas(this.clock.getBoundingClientRect());
        const { stage } = this;
        const scale = stage.width < 420 ? 0.76 : 1;
        const origin = (anchor.left + anchor.right) / 2;
        const x = Math.max(
            stage.left + 20 * scale,
            Math.min(stage.right - 40 * scale, origin + 22 * scale)
        );
        const y = anchor.top - 13 * scale;
        const endX = Math.min(
            stage.right - 24 * scale,
            Math.max(x + 44 * scale, clock.right + 14 * scale)
        );
        const endY = Math.max(stage.top + 22 * scale, clock.top - 28 * scale);
        const rise = Math.max(44 * scale, y - endY);
        const drift = endX - x;
        const moonOffset = (56 * scale) / Math.hypot(drift, rise);
        const moon = {
            x: Math.min(stage.right - 22 * scale, endX + drift * moonOffset),
            y: Math.max(stage.top + 22 * scale, y - rise * (1 + moonOffset) - 20 * scale),
        };
        this.rocket = {
            x,
            y,
            scale,
            rise,
            drift,
            clockEntry: Math.max(10 * scale, Math.min(rise * 0.45, y - clock.bottom)),
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
                x: moon.x + dx * scale * 1.15,
                y: moon.y + dy * scale * 1.15,
                size: size * scale,
                kind,
                variant: Math.sin(index * 2.4) > 0,
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
        let visibility = 1;
        for (let index = 0; index < this.protectedRects.length; index += 1) {
            const rect = this.protectedRects[index];
            const dx = Math.max(rect.left - x, 0, x - rect.right);
            const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            if (dx > radius + 14 || dy > radius + 14) {
                continue;
            }
            visibility = Math.min(visibility, Math.max(0, (Math.hypot(dx, dy) - radius - 5) / 9));
        }
        return visibility;
    }

    renderParticle(particle, angle, visibility = 1, offsetY = 0) {
        const phase = angle * particle.speed + particle.phase;
        const x = particle.x + Math.sin(phase) * 3.6 + Math.cos(phase * 2) * 0.8;
        const y = particle.y + offsetY + Math.sin(angle + particle.phase * 1.3) * 4.8;
        const size = particle.size * (0.94 + Math.sin(phase * 2) * 0.08);
        const opacity =
            visibility * (0.58 + Math.sin(phase * 2) * 0.14) * this.clearance(x, y, size + 2);
        if (opacity <= 0.01) {
            return;
        }
        const sprite = this.sprites.glyph(
            particle.kind,
            particle.color,
            particle.size,
            particle.variant
        );
        this.sprites.draw(
            this.context,
            sprite,
            x,
            y,
            particle.angle + Math.sin(phase) * 0.16,
            size / sprite.baseSize,
            opacity
        );
    }

    renderMeteors(time) {
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
            const opacity =
                Math.pow(Math.sin(phase * Math.PI), 0.7) * 0.85 * this.clearance(x, y, 3);
            if (opacity > 0.01) {
                this.sprites.drawTrail(
                    this.context,
                    x,
                    y,
                    path.dx,
                    path.dy,
                    16,
                    path.color,
                    opacity,
                    1.1,
                    1.3
                );
            }
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
        const colors = App.CelebrationAmbience.PARTY_COLORS;
        ctx.lineCap = 'round';
        pieces.forEach(([dx, dy, length], index) => {
            const px = flameX + dx * spread * scale + shake * (1 - age);
            const py = flameY + (dy * spread + 12 * age ** 2) * scale;
            const abovePrice = Math.min(1, (launch.y + 13 * scale - py) / (9 * scale));
            const opacity = fade * abovePrice;
            if (opacity <= 0) {
                return;
            }
            const rotation = index * 2.4 + age * (index % 2 ? -3 : 3);
            const cos = Math.cos(rotation) * this.ratio;
            const sin = Math.sin(rotation) * this.ratio;
            const color = colors[index % colors.length];
            const size = length * scale;
            ctx.globalAlpha = opacity;
            ctx.setTransform(cos, sin, -sin, cos, px * this.ratio, py * this.ratio);
            if (index % 3 === 0) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1.4 * scale;
                ctx.beginPath();
                ctx.moveTo(-size, 0);
                ctx.bezierCurveTo(-size / 2, -size, size / 2, size, size, 0);
                ctx.stroke();
            } else {
                ctx.fillStyle = color;
                ctx.fillRect(-size / 2, -scale, size, 2 * scale);
            }
        });
    }

    renderMoon(rocket, time, angle, progress, sinceArrival) {
        // The moon waits from the first moments, so the rocket visibly has somewhere to go.
        const intro = TokenCelebration.ease((time - 0.3) / 1.2);
        if (intro <= 0) {
            return;
        }
        const { scale, moon, stars } = rocket;
        const float = Math.sin(time * 0.75) * 1.5 * scale;
        // Its stars brighten as the rocket closes in, and fully on arrival.
        const starlight = intro * (0.4 + 0.6 * TokenCelebration.ease((progress - 0.55) / 0.45));
        stars.forEach((star) => this.renderParticle(star, angle, starlight, float));
        const pulse =
            sinceArrival > 0 && sinceArrival < 1.2 ? Math.sin((sinceArrival / 1.2) * Math.PI) : 0;
        this.sprites.draw(
            this.context,
            this.sprites.moon(scale * CELEBRATION_MOON_SIZE),
            moon.x,
            moon.y + float,
            0,
            (0.9 + 0.1 * intro) * (1 + 0.07 * pulse),
            intro
        );
    }

    // A brief ring of sparkles marks the moment the rocket reaches the moon.
    renderArrivalBurst(rocket, time, sinceArrival) {
        if (sinceArrival <= 0 || sinceArrival >= CELEBRATION_ARRIVAL_SECONDS) {
            return;
        }
        const { scale, moon } = rocket;
        const progress = sinceArrival / CELEBRATION_ARRIVAL_SECONDS;
        const spread = 1 - (1 - progress) ** 3;
        const fade = Math.min(1, progress / 0.08) * (1 - progress) ** 1.6;
        const centerY = moon.y + Math.sin(time * 0.75) * 1.5 * scale;
        for (let index = 0; index < 10; index += 1) {
            const direction = (index / 10) * Math.PI * 2 + 0.35;
            const distance = (18 + (index % 2 ? 20 : 30) * spread) * scale;
            const x = moon.x + Math.cos(direction) * distance;
            const y = centerY + Math.sin(direction) * distance;
            const isConfetti = index % 3 === 0;
            const size = (isConfetti ? 2.6 : 4.2) * scale;
            const opacity = fade * 0.95 * this.clearance(x, y, size);
            if (opacity <= 0.01) {
                continue;
            }
            const sprite = this.sprites.glyph(
                isConfetti ? 'confetti' : 'glint',
                index % 2 ? 'lilac' : 'gold',
                size,
                true
            );
            this.sprites.draw(
                this.context,
                sprite,
                x,
                y,
                direction + progress * 1.5,
                size / sprite.baseSize,
                opacity
            );
        }
    }

    renderExhaust(flicker, flame) {
        const ctx = this.context;
        // Flame points extend from the nozzle at y = 11 and shrink once the rocket hovers.
        const fy = (value) => 11 + (value - 11) * flame;
        const outer = () => {
            ctx.beginPath();
            ctx.moveTo(-3, 11);
            ctx.bezierCurveTo(-4.8, fy(17), -2.5, fy(21), flicker * 1.5, fy(29 + flicker * 4));
            ctx.bezierCurveTo(1.4, fy(22), 5, fy(17 + flicker), 3, 11);
            ctx.closePath();
        };
        const exhaust = ctx.createLinearGradient(0, 12, 0, fy(33));
        exhaust.addColorStop(0, this.color('pearl', 0.95));
        exhaust.addColorStop(0.35, this.color('gold', 0.9));
        exhaust.addColorStop(1, this.color('gold', 0));
        // A wider, faint copy stands in for a blurred glow at a fraction of the cost.
        const base = ctx.getTransform();
        const sx = 1.7;
        const sy = 1.2;
        ctx.setTransform(
            base.a * sx,
            base.b * sx,
            base.c * sy,
            base.d * sy,
            base.e + base.c * 11 * (1 - sy),
            base.f + base.d * 11 * (1 - sy)
        );
        ctx.fillStyle = this.color('gold', 0.22);
        outer();
        ctx.fill();
        ctx.setTransform(base);
        ctx.fillStyle = exhaust;
        outer();
        ctx.fill();
        ctx.fillStyle = this.color('pearl', 0.95);
        ctx.beginPath();
        ctx.moveTo(-1.6, 11);
        ctx.quadraticCurveTo(-2, fy(17), flicker * 0.6, fy(23 + flicker * 2));
        ctx.quadraticCurveTo(2.4, fy(17), 1.6, 11);
        ctx.fill();
    }

    // The invisible hover target follows the rocket. Style writes trigger a style and layout
    // pass, so it moves in whole pixels and only when its position actually changes.
    placeRocketTarget(x, y, hidden) {
        if (this.rocketTarget.hidden !== hidden) {
            this.rocketTarget.hidden = hidden;
        }
        const targetX = Math.round(this.origin.left + x);
        const targetY = Math.round(this.origin.top + y);
        const placement = `${targetX},${targetY},${this.rocketTipWidth}`;
        if (hidden || placement === this.rocketTargetPlacement) {
            return;
        }
        this.rocketTargetPlacement = placement;
        const viewportWidth = document.documentElement.clientWidth;
        const tipInset = Math.min(this.rocketTipWidth / 2 + 8, viewportWidth / 2);
        const tipCenter = Math.max(tipInset, Math.min(viewportWidth - tipInset, targetX));
        this.rocketTarget.style.setProperty('--rocket-tip-offset', `${tipCenter - targetX}px`);
        this.rocketTarget.classList.toggle(
            'tooltip-beside',
            viewportWidth - targetX >= this.rocketTipWidth + 40
        );
        this.rocketTarget.style.transform = `translate(${targetX}px, ${targetY}px) translate(-50%, -50%)`;
    }

    renderRocket(time, angle, pace) {
        const rocket = this.rocket;
        if (!rocket) {
            this.rocketTarget.hidden = true;
            return;
        }
        const ctx = this.context;
        const { scale } = rocket;
        const flightTime = time * pace;
        const progress = Math.min(1, flightTime / CELEBRATION_FLIGHT_SECONDS);
        // Real seconds since arrival, whatever the flight's pace.
        const sinceArrival = (flightTime - CELEBRATION_FLIGHT_SECONDS) / pace;
        const settle = TokenCelebration.ease(sinceArrival / 1.2);
        const pose = this.getRocketPose(rocket, flightTime);
        // Once it arrives, the rocket hovers beside the moon instead of freezing in place.
        pose.y += Math.sin(sinceArrival * 1.7) * 1.8 * scale * settle;
        pose.angle += Math.sin(sinceArrival * 1.1) * 0.05 * settle;
        const shake = 3.5 * Math.sin(time * Math.PI * 16) * Math.max(0, 1 - time / 0.5) ** 2;
        const rocketX = pose.x + shake * scale;

        this.placeRocketTarget(rocketX, pose.y, time < 0.2);

        this.renderMoon(rocket, time, angle, progress, sinceArrival);
        this.renderLaunchConfetti(rocket, time, shake * scale);
        this.renderArrivalBurst(rocket, time, sinceArrival);

        const fade = Math.min(1, time / 0.2);
        const flicker = Math.sin(time * Math.PI * 10) * 0.65 + Math.sin(time * Math.PI * 16) * 0.35;
        const cos = Math.cos(pose.angle);
        const sin = Math.sin(pose.angle);
        ctx.globalAlpha = fade * fade * (3 - 2 * fade);
        const unit = scale * this.ratio;
        ctx.setTransform(
            cos * unit,
            sin * unit,
            -sin * unit,
            cos * unit,
            rocketX * this.ratio,
            pose.y * this.ratio
        );
        // A quick, changing exhaust underneath a deliberately unhurried little craft.
        this.renderExhaust(flicker, 1 - 0.4 * settle);
        const body = this.sprites.rocketBody(scale);
        ctx.setTransform(cos, sin, -sin, cos, rocketX * this.ratio, pose.y * this.ratio);
        ctx.drawImage(body, -body.width / 2, -body.height / 2);
    }

    // Fast motion gets 60 fps; everything else is smooth at 30.
    isLively(time, pace) {
        if (time < CELEBRATION_LAUNCH_SECONDS) {
            return true;
        }
        const flightTime = time * pace;
        const passStart = CELEBRATION_FLIGHT.kickSeconds + CELEBRATION_FLIGHT.approachSeconds;
        if (pace === 1 && flightTime > passStart && flightTime < CELEBRATION_FLIGHT_SECONDS) {
            return true;
        }
        const sinceArrival = (flightTime - CELEBRATION_FLIGHT_SECONDS) / pace;
        if (sinceArrival > -0.1 && sinceArrival < CELEBRATION_ARRIVAL_SECONDS + 0.1) {
            return true;
        }
        return this.ambience.isLively(time);
    }

    render(time, pace) {
        const ctx = this.context;
        if (!ctx || !this.textBounds || !this.sprites) {
            return;
        }
        const width = Math.round(this.width * this.ratio);
        const height = Math.round(this.height * this.ratio);
        if (this.canvas.width !== width || this.canvas.height !== height) {
            this.canvas.width = width;
            this.canvas.height = height;
        }
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, width, height);

        // Back to front: the page-wide layer, the sparkles around the price, then the flight.
        this.ambience.render(ctx, this.ratio, time, this.sprites);
        const loopTime = time % 16;
        const angle = (loopTime * Math.PI * 2) / 16;
        this.particles.forEach((particle) => this.renderParticle(particle, angle));
        this.renderMeteors(loopTime);
        this.renderRocket(time, angle, pace);
        ctx.globalAlpha = 1;
        this.lively = this.isLively(time, pace);
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
        window.removeEventListener('resize', this.handleLayoutChange);
        window.removeEventListener('scroll', this.handleScroll);
        ['focusin', 'focusout'].forEach((event) => {
            this.trigger.removeEventListener(event, this.handleInteraction);
        });
    }
};

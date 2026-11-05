window.App = window.App || {};

const AMBIENCE_SPRINKLE_SECONDS = 6;
const AMBIENCE_STAR_SECONDS = 1.3;

/**
 * The page-wide part of the celebration: a confetti sprinkle on launch, then drifting
 * confetti and sparkles and an occasional shooting star, all fading out around text.
 *
 * It draws into the shared celebration canvas on every frame, so drawing avoids
 * per-piece allocations, colour parsing and canvas state stacks: confetti is grouped by
 * colour and placed with a single setTransform, and sparkles are pre-rendered stamps.
 */
window.App.CelebrationAmbience = class CelebrationAmbience {
    static PARTY_COLORS = ['#f8c34e', '#fa7199', '#64d5c3', '#ad85f5', '#71b9ff'];

    // Few and far between, so a star crossing the page stays a small surprise.
    static STAR_PATHS = [
        { x: 0.07, y: 0.14, dx: 150, dy: 52, offset: 2.4, period: 17, color: 'gold' },
        { x: 0.93, y: 0.1, dx: -140, dy: 60, offset: 9.1, period: 23, color: 'lilac' },
        { x: 0.12, y: 0.74, dx: 120, dy: -38, offset: 15.8, period: 29, color: 'lilac' },
    ];

    constructor() {
        this.context = null;
        this.sprites = null;
        this.ratio = 1;
        this.width = 0;
        this.height = 0;
        this.colors = [];
        this.activeColor = -1;
        this.drift = [];
        this.sprinkle = [];
        this.quietRects = [];
        this.dimRects = [];
    }

    // Deterministic noise keeps the composition stable across resizes and reloads.
    static random(index, salt) {
        const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
        return value - Math.floor(value);
    }

    layout({ width, height, palette, quietRects, dimRects }) {
        this.width = width;
        this.height = height;
        // Resolve colours once so frames never build or parse colour strings.
        this.colors = [
            ...CelebrationAmbience.PARTY_COLORS,
            `rgb(${palette.gold})`,
            `rgb(${palette.lilac})`,
        ];
        this.quietRects = quietRects;
        this.dimRects = dimRects;

        const area = Math.max(1, width * height);
        const driftCount = Math.round(Math.min(54, Math.max(14, area / 22000)));
        const sprinkleCount = Math.round(Math.min(64, Math.max(18, area / 18000)));
        if (this.drift.length !== driftCount) {
            this.drift = this.createPieces(driftCount, 0, false);
        }
        if (this.sprinkle.length !== sprinkleCount) {
            this.sprinkle = this.createPieces(sprinkleCount, 101, true);
        }
    }

    createPieces(count, seed, isSprinkle) {
        return (
            Array.from({ length: count }, (_, index) => this.createPiece(index + seed, isSprinkle))
                // Grouping by colour lets a frame switch fill styles a few times, not per piece.
                .sort((a, b) => a.color - b.color)
        );
    }

    createPiece(index, isSprinkle) {
        const random = (salt) => CelebrationAmbience.random(index, salt);
        const kinds = ['ribbon', 'diamond', 'squiggle', 'ribbon', 'dot'];
        // Mostly bright party confetti, with theme-tinted sparkles that echo the stage.
        const pick = random(13);
        const isGlint = !isSprinkle && pick < 0.18;
        const color = isGlint ? (pick < 0.09 ? 5 : 6) : Math.floor(random(14) * 5);
        const kind = isGlint ? 'glint' : kinds[Math.floor(random(11) * kinds.length)];

        return {
            x: random(1),
            // Sprinkle pieces start above the viewport; drifting ones are spread across it.
            y: isSprinkle ? -0.03 - random(2) * 0.32 : random(2),
            speed: isSprinkle ? 130 + random(3) * 80 : 9 + random(3) * 13,
            sway: (isSprinkle ? 14 : 10) + random(4) * 22,
            swaySpeed: 0.3 + random(5) * 0.5,
            phase: random(6) * Math.PI * 2,
            angle: random(7) * Math.PI * 2,
            spin: (random(8) - 0.5) * (isSprinkle ? 4 : 1.2),
            flipSpeed: 0.8 + random(9) * 1.8,
            size: (isSprinkle ? 3.2 : 3.1) + random(10) * 2.9,
            kind,
            // Flat pieces tumble; strokes, dots and sparkles keep their shape.
            tumbles: kind === 'ribbon' || kind === 'diamond',
            color,
            themeColor: color === 5 ? 'gold' : color === 6 ? 'lilac' : null,
            opacity: isSprinkle ? 0.82 + random(12) * 0.18 : 0.6 + random(12) * 0.32,
        };
    }

    clearance(x, y, radius) {
        let visibility = 1;
        const rects = this.quietRects;
        for (let index = 0; index < rects.length; index += 1) {
            const rect = rects[index];
            const dx = Math.max(rect.left - x, 0, x - rect.right);
            const dy = Math.max(rect.top - y, 0, y - rect.bottom);
            // Most pieces are far from text; skip the square root unless the fade applies.
            if (dx > radius + 30 || dy > radius + 30) {
                continue;
            }
            visibility = Math.min(visibility, Math.max(0, (Math.hypot(dx, dy) - radius - 8) / 22));
            if (visibility === 0) {
                return 0;
            }
        }
        const dims = this.dimRects;
        for (let index = 0; index < dims.length; index += 1) {
            const rect = dims[index];
            if (x > rect.left && x < rect.right && y > rect.top && y < rect.bottom) {
                return visibility * 0.35;
            }
        }
        return visibility;
    }

    drawPiece(piece, x, y, time, opacity) {
        const size = piece.size;
        if (y < -size * 2 || y > this.height + size * 2) {
            return;
        }
        const alpha = opacity * this.clearance(x, y, size);
        if (alpha <= 0.01) {
            return;
        }
        const ctx = this.context;
        const rotation = piece.angle + time * piece.spin;
        if (piece.kind === 'glint') {
            const sprite = this.sprites.glyph('glint', piece.themeColor, size);
            this.sprites.draw(ctx, sprite, x, y, rotation, size / sprite.baseSize, alpha);
            return;
        }
        if (piece.color !== this.activeColor) {
            this.activeColor = piece.color;
            ctx.fillStyle = this.colors[piece.color];
            ctx.strokeStyle = this.colors[piece.color];
        }
        ctx.globalAlpha = alpha;

        const flip = Math.cos(time * piece.flipSpeed + piece.phase);
        const cos = Math.cos(rotation) * this.ratio;
        const sin = Math.sin(rotation) * this.ratio;
        // Squashing one axis by a cosine reads as a piece of paper tumbling in 3D.
        const squash = piece.tumbles ? Math.abs(flip) * 0.85 + 0.15 : 1;
        ctx.setTransform(cos, sin, -sin * squash, cos * squash, x * this.ratio, y * this.ratio);

        if (piece.kind === 'ribbon') {
            ctx.fillRect(-size, -size * 0.32, size * 2, size * 0.64);
            return;
        }
        ctx.beginPath();
        if (piece.kind === 'diamond') {
            ctx.moveTo(0, -size);
            ctx.lineTo(size * 0.55, 0);
            ctx.lineTo(0, size);
            ctx.lineTo(-size * 0.55, 0);
            ctx.fill();
        } else if (piece.kind === 'dot') {
            ctx.arc(0, 0, size * 0.42, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.moveTo(-size, 0);
            ctx.bezierCurveTo(-size / 2, -size * flip, size / 2, size * flip, size, 0);
            ctx.stroke();
        }
    }

    getStarAge(path, time) {
        return time < path.offset ? Infinity : (time - path.offset) % path.period;
    }

    // The sprinkle falls fast enough to need a higher frame rate; shooting stars are brief
    // streaks whose gradient tails read smoothly at the calm rate.
    isLively(time) {
        return time < AMBIENCE_SPRINKLE_SECONDS;
    }

    renderShootingStars(time) {
        const reach = Math.min(1, this.width / 900);
        const paths = CelebrationAmbience.STAR_PATHS;
        for (let index = 0; index < paths.length; index += 1) {
            const path = paths[index];
            const age = this.getStarAge(path, time);
            if (age > AMBIENCE_STAR_SECONDS) {
                continue;
            }
            const phase = age / AMBIENCE_STAR_SECONDS;
            const dx = path.dx * reach;
            const dy = path.dy * reach;
            const x = path.x * this.width + dx * phase;
            const y = path.y * this.height + dy * phase;
            const opacity =
                Math.pow(Math.sin(phase * Math.PI), 0.7) * 0.9 * this.clearance(x, y, 4);
            if (opacity > 0.01) {
                this.sprites.drawTrail(
                    this.context,
                    x,
                    y,
                    dx,
                    dy,
                    40,
                    path.color,
                    opacity,
                    1.5,
                    1.6
                );
                this.activeColor = -1;
            }
        }
    }

    render(ctx, ratio, time, sprites) {
        if (!this.width) {
            return;
        }
        this.context = ctx;
        this.ratio = ratio;
        this.sprites = sprites;
        this.activeColor = -1;
        this.renderShootingStars(time);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // Drifting pieces fade in beneath the sprinkle, then keep falling slowly and wrapping.
        const span = this.height + 40;
        const driftFade = Math.min(1, time / 2.5);
        for (let index = 0; index < this.drift.length; index += 1) {
            const piece = this.drift[index];
            const y = ((piece.y * span + piece.speed * time) % span) - 20;
            const x =
                piece.x * this.width + Math.sin(time * piece.swaySpeed + piece.phase) * piece.sway;
            const twinkle = 0.85 + Math.sin(time * 1.3 + piece.phase) * 0.15;
            this.drawPiece(piece, x, y, time, piece.opacity * twinkle * driftFade);
        }

        if (time < AMBIENCE_SPRINKLE_SECONDS) {
            const progress = time / AMBIENCE_SPRINKLE_SECONDS;
            // Hold the sprinkle while it crosses the page, then let it dissolve.
            const fade = Math.min(1, time / 0.25) * Math.min(1, (1 - progress) / 0.45) ** 1.3;
            const limit = this.height * 0.85;
            for (let index = 0; index < this.sprinkle.length; index += 1) {
                const piece = this.sprinkle[index];
                // Each piece decelerates as it falls, like paper meeting air resistance.
                const y = piece.y * this.height + piece.speed * time * (1 - progress * 0.45);
                const x =
                    piece.x * this.width +
                    Math.sin(time * piece.swaySpeed * 2 + piece.phase) * piece.sway;
                // Let the sprinkle dissolve before it reaches the lower part of the page.
                const depth = Math.max(0, Math.min(1, (limit - y) / 120));
                this.drawPiece(piece, x, y, time, piece.opacity * fade * depth);
            }
        }
        ctx.globalAlpha = 1;
    }
};

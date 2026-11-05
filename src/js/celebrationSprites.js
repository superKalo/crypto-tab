window.App = window.App || {};

/**
 * Pre-rendered celebration artwork. Canvas shadows are costly to draw on every frame, so
 * glowing glyphs, the moon and the rocket body are rasterised once per theme and display
 * ratio, then stamped onto the celebration canvas with drawImage.
 */
window.App.CelebrationSprites = class CelebrationSprites {
    constructor(palette, ratio) {
        this.palette = palette;
        this.ratio = ratio;
        this.cache = new Map();
    }

    color(name, opacity) {
        return `rgba(${this.palette[name]}, ${opacity})`;
    }

    // Creates a square sprite whose drawing origin is its centre, in CSS pixels.
    createSprite(radius) {
        const canvas = document.createElement('canvas');
        const size = Math.ceil(radius * 2 * this.ratio);
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        context.setTransform(this.ratio, 0, 0, this.ratio, size / 2, size / 2);
        return { canvas, context };
    }

    remember(key, draw) {
        let sprite = this.cache.get(key);
        if (!sprite) {
            sprite = draw();
            this.cache.set(key, sprite);
        }
        return sprite;
    }

    static traceGlyph(ctx, kind, size, variant) {
        ctx.beginPath();
        if (kind === 'confetti') {
            if (variant) {
                ctx.moveTo(0, -size);
                ctx.lineTo(size * 0.55, 0);
                ctx.lineTo(0, size);
                ctx.lineTo(-size * 0.55, 0);
                ctx.closePath();
                ctx.fill();
            } else {
                ctx.fillRect(-size, -0.5, size * 2, 1);
            }
        } else if (kind === 'glint') {
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
        } else if (kind === 'seed') {
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
    }

    // Sizes share quarter-pixel buckets; callers scale the stamp to the exact size.
    glyph(kind, color, size, variant = false) {
        const bucket = Math.max(0.5, Math.round(size * 4) / 4);
        return this.remember(`glyph:${kind}:${color}:${bucket}:${variant ? 1 : 0}`, () => {
            const glow = kind === 'confetti' ? 0 : 7;
            // Shadow blur is measured in device pixels, exactly as in a live draw.
            const { canvas, context } = this.createSprite(bucket + 2 + (glow * 1.6) / this.ratio);
            context.lineWidth = 0.85;
            context.lineCap = 'round';
            context.strokeStyle = this.color(color, 1);
            context.fillStyle = this.color(color, 0.85);
            context.shadowColor = this.color(color, 0.7);
            context.shadowBlur = glow;
            CelebrationSprites.traceGlyph(context, kind, bucket, variant);
            canvas.baseSize = bucket;
            return canvas;
        });
    }

    moon(scale) {
        return this.remember(`moon:${scale}`, () => {
            const { canvas, context: ctx } = this.createSprite(15 * scale + 14 / this.ratio);
            ctx.scale(-scale, scale);
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
            return canvas;
        });
    }

    // The rocket's static body; the exhaust flickers and is drawn live beneath it.
    rocketBody(scale) {
        return this.remember(`rocket:${scale}`, () => {
            const { canvas, context: ctx } = this.createSprite(21 * scale + 2);
            ctx.scale(scale, scale);
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
            return canvas;
        });
    }

    // Stamps a sprite centred on (x, y) in CSS pixels, rotated and scaled about its centre.
    draw(ctx, sprite, x, y, rotation, scale, alpha) {
        const cos = Math.cos(rotation) * scale;
        const sin = Math.sin(rotation) * scale;
        ctx.globalAlpha = alpha;
        ctx.setTransform(cos, sin, -sin, cos, x * this.ratio, y * this.ratio);
        ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
    }

    // A shooting-star trail: a gradient tail that brightens towards a round head.
    drawTrail(ctx, x, y, dx, dy, length, color, opacity, width, head) {
        const distance = Math.hypot(dx, dy) || 1;
        const tailX = x - (dx / distance) * length;
        const tailY = y - (dy / distance) * length;
        const channels = this.palette[color];
        ctx.globalAlpha = 1;
        ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
        const tail = ctx.createLinearGradient(tailX, tailY, x, y);
        tail.addColorStop(0, `rgba(${channels}, 0)`);
        tail.addColorStop(1, `rgba(${channels}, ${opacity})`);
        ctx.strokeStyle = tail;
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.fillStyle = `rgba(${channels}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(x, y, head, 0, Math.PI * 2);
        ctx.fill();
    }
};

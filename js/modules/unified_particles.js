/* ========================================= */
/* MODULE - UNIFIED FULL-SCREEN PARTICLES     */
/* Fuhrt die beiden redundanten Vollbild-     */
/* Canvas-Partikelsysteme (depth-experience   */
/* + parallax) in EINEN registerAnimation-    */
/* Loop zusammen (Firefox-Performance).       */
/* ========================================= */

import { registerAnimation } from '../utils/animation_manager.js';
import { sizeCanvas, cleanupRegistry } from '../utils/helpers.js';

export function initUnifiedParticles() {
    /* ZWEI uberlagerte Canvases, um die urspruengliche Schichtung 1:1 zu erhalten:
       - back  (z3): Fische + Parallax-Stil-Partikel/-Bubbles (HINTER Sections)
       - front (z7): Depth-Stil-Partikel/-Bubbles (Schleier VOR dem Content)
       Beide werden aber in EINEM gemeinsamen rAF-Callback gezeichnet -
       nur ein Loop-Overhead statt zwei. */
    const canvasBack = document.createElement('canvas');
    canvasBack.className = 'unified-particles-canvas-back';
    canvasBack.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:3;';
    document.body.appendChild(canvasBack);
    const ctxBack = canvasBack.getContext('2d', { alpha: true });

    const canvasFront = document.createElement('canvas');
    canvasFront.className = 'unified-particles-canvas-front';
    canvasFront.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:7;';
    document.body.appendChild(canvasFront);
    const ctxFront = canvasFront.getContext('2d', { alpha: true });

    let width = 0;
    let height = 0;
    let time = 0;
    let lastTime = 0;

    /* ---- Parallax-Stil (back, z3) ---- */
    const backParticles = [];
    const backBubbles = [];
    const fishes = [];
    /* ---- Depth-Stil (front, z7) ---- */
    const frontParticles = [];
    const frontBubbles = [];

    const COLORS = [
        '73, 146, 154', '201, 168, 97', '73, 146, 154',
        '201, 168, 97', '120, 50, 50',  '73, 146, 154',
    ];
    const COLORS_GOLD = [201, 168, 97];
    const COLORS_CYAN = [73, 146, 154];
    const TWO_PI = 6.2832;

    /* Anzahlen bewusst reduziert: Die beiden alten Systeme hatten zusammen
       25+30=55 Partikel und 12+12=24 Bubbles. Aufgeteilt wird jetzt auf das
       Niveau des groesseren Einzelsystems (depth: 30 Partikel / 12 Bubbles),
       sodass pro Frame deutlich weniger Zeichenarbeit anfaellt. */
    const BACK_PARTICLE_COUNT = 12;
    const BACK_BUBBLE_COUNT = 5;
    const FRONT_PARTICLE_COUNT = 18;
    const FRONT_BUBBLE_COUNT = 7;
    const FISH_COUNT = 3;

    function initBackParticles() {
        backParticles.length = 0;
        for (let i = 0; i < BACK_PARTICLE_COUNT; i++) {
            backParticles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: 1 + Math.random() * 2.5,
                color: COLORS[i % COLORS.length],
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.2 - 0.1,
                phase: Math.random() * TWO_PI,
            });
        }
    }

    function initBackBubbles() {
        backBubbles.length = 0;
        for (let i = 0; i < BACK_BUBBLE_COUNT; i++) {
            backBubbles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: 2 + Math.random() * 5,
                speed: 0.3 + Math.random() * 0.8,
                swayPhase: Math.random() * TWO_PI,
            });
        }
    }

    function initFishes() {
        fishes.length = 0;
        for (let i = 0; i < FISH_COUNT; i++) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            fishes.push({
                x: Math.random() * width,
                y: height * 0.2 + Math.random() * height * 0.4,
                size: 15 + Math.random() * 20,
                direction,
                swimSpeed: 0.3 + Math.random() * 0.5,
                wobbleAmp: 3 + Math.random() * 8,
                phase: Math.random() * TWO_PI,
                speed: 0.02 + Math.random() * 0.02,
            });
        }
    }

    function initFrontParticles() {
        frontParticles.length = 0;
        for (let i = 0; i < FRONT_PARTICLE_COUNT; i++) {
            const isGold = Math.random() > 0.5;
            const rgb = isGold ? COLORS_GOLD : COLORS_CYAN;
            frontParticles.push({
                x: Math.random() * width,
                r: 1 + Math.random() * 2.5,
                baseY: Math.random() * height,
                floatAmp: 8 + Math.random() * 20,
                floatSpeed: 0.15 + Math.random() * 0.4,
                phase: Math.random() * TWO_PI,
                rgb,
                baseOpacity: 0.12 + Math.random() * 0.25,
                horizontalDrift: (Math.random() - 0.5) * 0.3,
            });
        }
    }

    function initFrontBubbles() {
        frontBubbles.length = 0;
        for (let i = 0; i < FRONT_BUBBLE_COUNT; i++) {
            const isGold = Math.random() > 0.4;
            const rgb = isGold ? COLORS_GOLD : COLORS_CYAN;
            frontBubbles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: 3 + Math.random() * 7,
                baseY: Math.random() * height,
                speed: 0.3 + Math.random() * 0.8,
                wobble: Math.random() * TWO_PI,
                wobbleSpeed: 0.02 + Math.random() * 0.04,
                wobbleAmp: 15 + Math.random() * 30,
                rgb,
                baseOpacity: 0.08 + Math.random() * 0.2,
                highlightOffset: 0.25 + Math.random() * 0.15,
            });
        }
    }

    /* ---- Resize: vereinheitlicht auf sizeCanvas() mit 2560px-Cap ---- */
    function resize() {
        const logicalW = window.innerWidth;
        const logicalH = window.innerHeight;
        const result = sizeCanvas(canvasBack, logicalW, logicalH);
        sizeCanvas(canvasFront, logicalW, logicalH);
        width = result.width;
        height = result.height;
        canvasBack.style.width = logicalW + 'px';
        canvasBack.style.height = logicalH + 'px';
        canvasFront.style.width = logicalW + 'px';
        canvasFront.style.height = logicalH + 'px';
        initBackParticles();
        initBackBubbles();
        initFishes();
        initFrontParticles();
        initFrontBubbles();
    }

    function onResize() {
        resize();
    }

    /* ---- Zeichenlogik back (Parallax-Stil) ---- */
    function drawBackParticles() {
        for (let i = 0; i < backParticles.length; i++) {
            const p = backParticles[i];
            p.phase += 0.015;
            const driftX = Math.sin(p.phase) * 0.15;
            const driftY = Math.cos(p.phase * 0.7) * 0.1 - 0.08;
            p.x += driftX + p.vx;
            p.y += driftY + p.vy;
            if (p.y < -5) p.y = height + 5;
            if (p.y > height + 5) p.y = -5;
            if (p.x < -5) p.x = width + 5;
            if (p.x > width + 5) p.x = -5;
            const opacity = 0.15 + (Math.sin(p.phase * 2) * 0.5 + 0.5) * 0.45;
            ctxBack.beginPath();
            ctxBack.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
            ctxBack.fillStyle = `rgba(${p.color}, ${opacity * 0.1})`;
            ctxBack.fill();
            ctxBack.beginPath();
            ctxBack.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctxBack.fillStyle = `rgba(${p.color}, ${opacity})`;
            ctxBack.fill();
        }
    }

    function drawBackBubbles() {
        for (let i = 0; i < backBubbles.length; i++) {
            const b = backBubbles[i];
            b.y -= b.speed;
            b.swayPhase += 0.02;
            const swayX = Math.sin(b.swayPhase) * 2;
            let opacity = 0;
            if (b.y > height * 0.8) opacity = (height - b.y) / (height * 0.2);
            else if (b.y < height * 0.1) opacity = b.y / (height * 0.1);
            else opacity = 0.5;
            opacity = Math.max(0, Math.min(0.5, opacity));
            if (b.y < -20) {
                b.y = height + 20;
                b.x = Math.random() * width;
                b.speed = 0.5 + Math.random() * 1;
                b.swayPhase = Math.random() * TWO_PI;
            }
            const bx = b.x + swayX;
            ctxBack.beginPath();
            ctxBack.arc(bx, b.y, b.r, 0, Math.PI * 2);
            ctxBack.strokeStyle = `rgba(73, 146, 154, ${opacity * 0.6})`;
            ctxBack.lineWidth = 0.8;
            ctxBack.stroke();
            ctxBack.beginPath();
            ctxBack.arc(bx - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.25, 0, Math.PI * 2);
            ctxBack.fillStyle = `rgba(150, 220, 220, ${opacity * 0.4})`;
            ctxBack.fill();
        }
    }

    function drawFishes(now) {
        for (let i = 0; i < fishes.length; i++) {
            const f = fishes[i];
            f.phase += f.speed;
            f.x += f.direction * f.swimSpeed;
            const wobble = Math.sin(f.phase) * f.wobbleAmp;
            const fy = f.y + wobble;
            if (f.direction > 0 && f.x > width + 20) {
                f.x = -20;
                f.y = height * 0.2 + Math.random() * height * 0.4;
            } else if (f.direction < 0 && f.x < -20) {
                f.x = width + 20;
                f.y = height * 0.2 + Math.random() * height * 0.4;
            }
            const s = f.size;
            const tailWag = Math.sin(now * 0.005 + f.phase) * s * 0.15;
            ctxBack.save();
            ctxBack.translate(f.x, fy);
            ctxBack.scale(f.direction, 1);
            ctxBack.globalAlpha = 0.25;
            ctxBack.fillStyle = 'rgba(35, 80, 95, 0.8)';
            ctxBack.beginPath();
            ctxBack.moveTo(s * 0.5, 0);
            ctxBack.quadraticCurveTo(s * 0.25, -s * 0.2, -s * 0.3, -s * 0.12);
            ctxBack.quadraticCurveTo(-s * 0.45, 0, -s * 0.3, s * 0.12);
            ctxBack.quadraticCurveTo(s * 0.25, s * 0.2, s * 0.5, 0);
            ctxBack.fill();
            ctxBack.beginPath();
            ctxBack.moveTo(-s * 0.3, 0);
            ctxBack.lineTo(-s * 0.5 + tailWag, -s * 0.12);
            ctxBack.lineTo(-s * 0.5 + tailWag * 0.5, 0);
            ctxBack.lineTo(-s * 0.5 + tailWag, s * 0.12);
            ctxBack.closePath();
            ctxBack.fill();
            ctxBack.strokeStyle = 'rgba(201, 168, 97, 0.3)';
            ctxBack.lineWidth = 0.8;
            ctxBack.beginPath();
            ctxBack.moveTo(s * 0.4, 0);
            ctxBack.quadraticCurveTo(0, s * 0.03, -s * 0.35, 0);
            ctxBack.stroke();
            ctxBack.fillStyle = 'rgba(201, 168, 97, 0.5)';
            ctxBack.beginPath();
            ctxBack.arc(s * 0.3, -s * 0.01, s * 0.035, 0, Math.PI * 2);
            ctxBack.fill();
            ctxBack.globalAlpha = 1;
            ctxBack.restore();
        }
    }

    /* ---- Zeichenlogik front (Depth-Stil) ---- */
    function drawFrontParticles() {
        for (let i = 0; i < frontParticles.length; i++) {
            const p = frontParticles[i];
            const floatY = p.baseY + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            let drawY = ((floatY % height) + height) % height;
            let drawX = p.x;
            p.x += p.horizontalDrift;
            if (drawX < -20) drawX += width + 40;
            else if (drawX > width + 20) drawX -= width + 40;
            const opacity = p.baseOpacity * (0.6 + 0.4 * Math.sin(time * 0.4 + p.phase));
            ctxFront.fillStyle = `rgba(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]},${opacity})`;
            ctxFront.beginPath();
            ctxFront.arc(drawX, drawY, p.r, 0, TWO_PI);
            ctxFront.fill();
        }
    }

    function drawFrontBubbles() {
        for (let i = 0; i < frontBubbles.length; i++) {
            const b = frontBubbles[i];
            b.y -= b.speed;
            if (b.y < -20) { b.y = height + 20; b.x = Math.random() * width; }
            b.wobble += b.wobbleSpeed;
            let wobbleX = Math.sin(b.wobble) * b.wobbleAmp;
            let drawX = b.x + wobbleX;
            let drawY = b.baseY - (time * b.speed * 20) % (height + 40) + b.y;
            if (drawX < -30) drawX += width + 60;
            else if (drawX > width + 30) drawX -= width + 60;
            drawY = ((drawY % (height + 40)) + height + 40) % (height + 40) - 20;
            const opacity = b.baseOpacity * (0.7 + 0.3 * Math.sin(time * 0.6 + b.wobble));
            ctxFront.fillStyle = `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},${opacity * 0.15})`;
            ctxFront.beginPath();
            ctxFront.arc(drawX, drawY, b.r, 0, TWO_PI);
            ctxFront.fill();
            ctxFront.strokeStyle = `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},${opacity * 0.6})`;
            ctxFront.lineWidth = 0.8;
            ctxFront.beginPath();
            ctxFront.arc(drawX, drawY, b.r, 0, TWO_PI);
            ctxFront.stroke();
            const hx = drawX - b.r * b.highlightOffset;
            const hy = drawY - b.r * b.highlightOffset;
            ctxFront.fillStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
            ctxFront.beginPath();
            ctxFront.arc(hx, hy, b.r * 0.2, 0, TWO_PI);
            ctxFront.fill();
        }
    }

    /* ---- EIN gemeinsamer rAF-Loop fuer beide Canvases ---- */
    function frame(now) {
        if (!lastTime) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        time += dt;

        ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
        drawBackParticles();
        drawBackBubbles();
        drawFishes(now);

        ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height);
        drawFrontParticles();
        drawFrontBubbles();
    }

    /* ---- INIT ---- */
    resize();
    window.addEventListener('resize', onResize, { passive: true });

    const unregisterFrame = registerAnimation(frame);

    function destroy() {
        window.removeEventListener('resize', onResize);
        unregisterFrame();
        canvasBack.remove();
        canvasFront.remove();
    }

    cleanupRegistry.register(destroy);

    return destroy;
}

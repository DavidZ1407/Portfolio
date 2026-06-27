/* ========================================= */
/* MODULE - BIOLUMINESCENT SWARM             */
/* Deep sea creature shadows on the          */
/* timeline section background. Persistent   */
/* atmospheric effect with organic movement. */
/* ========================================= */

import { debounce, cleanupRegistry } from '../utils/helpers.js';

/* ----------------------------------------- */
/* CREATURE TYPES                            */
/* ----------------------------------------- */

const CREATURE_TYPES = {
    jellyfish: {
        draw(ctx, x, y, size, glow, seed) {
            ctx.save();
            ctx.translate(x, y);

            // Body (dome)
            ctx.beginPath();
            ctx.moveTo(-size * 0.5, 0);
            ctx.quadraticCurveTo(-size * 0.5, -size * 0.6, 0, -size * 0.7);
            ctx.quadraticCurveTo(size * 0.5, -size * 0.6, size * 0.5, 0);
            ctx.closePath();
            ctx.fillStyle = `rgba(5, 15, 30, ${0.5 + glow * 0.2})`;
            ctx.fill();

            // Tentacles — using pre-computed seed for stable lengths
            for (let i = 0; i < 5; i++) {
                const tx = -size * 0.3 + (i / 4) * size * 0.6;
                const tentSeed = seed ? seed.tentLens[i] : 0.5;
                const tentLen = size * (0.4 + tentSeed * 0.3);
                // Smooth sway using continuous sine, not random
                const sway = Math.sin(glow * 1.5 + i * 1.2 + seed.offset) * size * 0.15;
                const sway2 = Math.sin(glow * 0.8 + i * 0.9 + seed.offset * 1.3) * size * 0.1;
                ctx.beginPath();
                ctx.moveTo(tx, 0);
                ctx.quadraticCurveTo(
                    tx + sway,
                    tentLen * 0.5,
                    tx + sway2,
                    tentLen
                );
                ctx.strokeStyle = `rgba(5, 15, 30, ${0.3 + glow * 0.1})`;
                ctx.lineWidth = 1 + size * 0.02;
                ctx.stroke();
            }

            // Bioluminescent spots (BRIGHT)
            const spotCount = 3;
            for (let i = 0; i < spotCount; i++) {
                const sx = -size * 0.2 + (i / (spotCount - 1)) * size * 0.4;
                const sy = -size * 0.35;
                const sr = size * 0.05 + Math.sin(glow * 2 + i) * size * 0.015;
                const alpha = 0.6 + Math.sin(glow * 1.5 + i * 1.3) * 0.3;

                // Large glow halo
                const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr * 8);
                grad.addColorStop(0, `rgba(150, 220, 220, ${alpha * 0.6})`);
                grad.addColorStop(0.3, `rgba(73, 146, 154, ${alpha * 0.3})`);
                grad.addColorStop(0.6, `rgba(73, 146, 154, ${alpha * 0.1})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(sx, sy, sr * 8, 0, Math.PI * 2);
                ctx.fill();

                // Bright core
                ctx.fillStyle = `rgba(150, 220, 220, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, sr, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
        },
        w: 0.8, // aspect multiplier
        h: 1.2,
    },

    squid: {
        draw(ctx, x, y, size, glow, seed) {
            ctx.save();
            ctx.translate(x, y);

            // Body (elongated mantle)
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.8);
            ctx.quadraticCurveTo(size * 0.3, -size * 0.5, size * 0.25, 0);
            ctx.lineTo(-size * 0.25, 0);
            ctx.quadraticCurveTo(-size * 0.3, -size * 0.5, 0, -size * 0.8);
            ctx.closePath();
            ctx.fillStyle = `rgba(3, 8, 15, ${0.35 + glow * 0.15})`;
            ctx.fill();

            // Tentacles — using pre-computed seed for stable lengths
            for (let i = 0; i < 6; i++) {
                const tx = -size * 0.2 + (i / 5) * size * 0.4;
                const tentSeed = seed ? seed.tentLens[i] : 0.5;
                const tentLen = size * (0.5 + tentSeed * 0.2);
                // Smooth organic sway — continuous sine waves, no randomness
                const sway1 = Math.sin(glow * 1.2 + i * 0.8 + seed.offset) * size * 0.2;
                const sway2 = Math.sin(glow * 0.7 + i * 1.1 + seed.offset * 1.5) * size * 0.25;
                ctx.beginPath();
                ctx.moveTo(tx, 0);
                ctx.quadraticCurveTo(
                    tx + sway1,
                    tentLen * 0.6,
                    tx + sway2,
                    tentLen
                );
                ctx.strokeStyle = `rgba(3, 8, 15, ${0.2 + glow * 0.1})`;
                ctx.lineWidth = 1.5 + size * 0.015;
                ctx.stroke();
            }

            // Eyes (two glowing spots)
            for (let side = -1; side <= 1; side += 2) {
                const ex = side * size * 0.12;
                const ey = -size * 0.15;
                const er = size * 0.035;
                const alpha = 0.5 + Math.sin(glow * 1.8) * 0.2;

                const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, er * 5);
                grad.addColorStop(0, `rgba(150, 220, 220, ${alpha * 0.5})`);
                grad.addColorStop(0.5, `rgba(73, 146, 154, ${alpha * 0.15})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(ex, ey, er * 5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(150, 220, 220, ${alpha})`;
                ctx.beginPath();
                ctx.arc(ex, ey, er, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bioluminescent line along body
            const lineAlpha = 0.15 + Math.sin(glow * 1.2) * 0.1;
            ctx.beginPath();
            ctx.moveTo(0, -size * 0.7);
            ctx.lineTo(0, -size * 0.1);
            ctx.strokeStyle = `rgba(150, 220, 220, ${lineAlpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        },
        w: 0.6,
        h: 1.4,
    },

    anglerShadow: {
        draw(ctx, x, y, size, glow) {
            ctx.save();
            ctx.translate(x, y);

            // Body (bulbous)
            ctx.beginPath();
            ctx.ellipse(0, 0, size * 0.35, size * 0.25, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(3, 8, 15, ${0.5 + glow * 0.2})`;
            ctx.fill();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-size * 0.3, 0);
            ctx.quadraticCurveTo(-size * 0.6, -size * 0.15, -size * 0.65, -size * 0.05);
            ctx.quadraticCurveTo(-size * 0.55, size * 0.05, -size * 0.3, size * 0.05);
            ctx.closePath();
            ctx.fillStyle = `rgba(3, 8, 15, ${0.35 + glow * 0.1})`;
            ctx.fill();

            // Lure (anglerfish antenna)
            const lureCurveX = size * 0.1;
            const lureCurveY = -size * 0.5;
            const lureTipX = size * 0.15;
            const lureTipY = -size * 0.65;

            ctx.beginPath();
            ctx.moveTo(size * 0.15, -size * 0.15);
            ctx.quadraticCurveTo(lureCurveX, lureCurveY, lureTipX, lureTipY);
            ctx.strokeStyle = `rgba(3, 8, 15, ${0.25})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Lure glow
            const lureAlpha = 0.6 + Math.sin(glow * 2.5) * 0.3;
            const lr = size * 0.03;

            const grad = ctx.createRadialGradient(lureTipX, lureTipY, 0, lureTipX, lureTipY, lr * 10);
            grad.addColorStop(0, `rgba(150, 220, 220, ${lureAlpha * 0.6})`);
            grad.addColorStop(0.3, `rgba(73, 146, 154, ${lureAlpha * 0.2})`);
            grad.addColorStop(0.7, `rgba(73, 146, 154, ${lureAlpha * 0.05})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(lureTipX, lureTipY, lr * 10, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(200, 240, 255, ${lureAlpha})`;
            ctx.beginPath();
            ctx.arc(lureTipX, lureTipY, lr, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            const eyeAlpha = 0.3 + Math.sin(glow * 1.5) * 0.15;
            ctx.fillStyle = `rgba(73, 146, 154, ${eyeAlpha})`;
            ctx.beginPath();
            ctx.arc(size * 0.2, -size * 0.05, size * 0.025, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        },
        w: 1.2,
        h: 0.8,
    },
};

/* ----------------------------------------- */
/* MODULE INIT                               */
/* ----------------------------------------- */

export function initBioluminescentSwarm() {
    const section = document.querySelector('.journey_section');
    if (!section) return;

    // Remove old canvas if exists
    const oldCanvas = section.querySelector('.swarm-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'swarm-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 2s ease;
    `;
    section.style.position = 'relative';
    section.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let animFrame = null;
    let isActive = false;
    let time = 0;
    let creatures = [];

    // Dynamic creature count based on viewport
    function getCreatureCount() {
        if (window.innerWidth <= 480) return 4;
        if (window.innerWidth <= 768) return 6;
        if (window.innerWidth <= 1200) return 9;
        return 12;
    }
    const isMobile = window.innerWidth <= 768;
    const CREATURE_COUNT = getCreatureCount();

    /* ---- IntersectionObserver ---- */
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                canvas.style.opacity = '1';
                if (!isActive) {
                    isActive = true;
                    resize();
                    spawnCreatures();
                    lastFrameTime = 0;
                    animate(performance.now());
                }
            } else {
                canvas.style.opacity = '0';
                if (isActive) {
                    isActive = false;
                    if (animFrame) {
                        cancelAnimationFrame(animFrame);
                        animFrame = null;
                    }
                }
            }
        });
    }, { threshold: 0.05 });

    observer.observe(section);

    function resize() {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
    }

    const debouncedResize = debounce(resize, 200);
    window.addEventListener('resize', debouncedResize);
    setTimeout(resize, 50);

    /* ---- Spawn Creatures ---- */
    function spawnCreatures() {
        creatures = [];
        const types = Object.keys(CREATURE_TYPES);
        const w = canvas.width;
        const h = canvas.height;

        for (let i = 0; i < CREATURE_COUNT; i++) {
            const typeKey = types[i % types.length];
            const type = CREATURE_TYPES[typeKey];
            const size = (isMobile ? 40 : 60) + Math.random() * 40;

            // Pre-compute tentacle seed data for smooth animation
            const tentLens = [];
            for (let t = 0; t < 6; t++) {
                tentLens.push(Math.random());
            }
            creatures.push({
                type: typeKey,
                x: Math.random() * w,
                y: Math.random() * h,
                size: size,
                speedX: (Math.random() - 0.5) * 0.3,
                speedY: (Math.random() - 0.5) * 0.15,
                phase: Math.random() * Math.PI * 2,
                floatAmpX: 10 + Math.random() * 20,
                floatAmpY: 5 + Math.random() * 10,
                floatSpeedX: 0.1 + Math.random() * 0.2,
                floatSpeedY: 0.15 + Math.random() * 0.25,
                opacity: 0,
                targetOpacity: 0.3 + Math.random() * 0.4,
                depth: Math.random(),
                seed: {
                    tentLens: tentLens,
                    offset: Math.random() * Math.PI * 2,
                },
            });
        }
    }

    let lastFrameTime = 0;

    /* ---- Animate ---- */
    function animate(now) {
        if (!isActive) return;
        if (!lastFrameTime) lastFrameTime = now;
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        time += dt;

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        creatures.forEach(c => {
            const type = CREATURE_TYPES[c.type];

            // Organic floating movement
            const floatX = Math.sin(time * c.floatSpeedX + c.phase) * c.floatAmpX;
            const floatY = Math.sin(time * c.floatSpeedY + c.phase * 1.3) * c.floatAmpY;

            let drawX = c.x + floatX;
            let drawY = c.y + floatY;

            // Wrap around edges
            const margin = c.size * 2;
            if (drawX < -margin) c.x += w + margin * 2;
            if (drawX > w + margin) c.x -= w + margin * 2;
            if (drawY < -margin) c.y += h + margin * 2;
            if (drawY > h + margin) c.y -= h + margin * 2;

            // Drift
            c.x += c.speedX;
            c.y += c.speedY;

            // Fade in/out
            c.opacity += (c.targetOpacity - c.opacity) * 0.01;

            // Depth-based opacity modulation
            const depthMod = 0.5 + c.depth * 0.5;
            const finalOpacity = c.opacity * depthMod;

            if (finalOpacity < 0.01) return;

            ctx.globalAlpha = finalOpacity;
            type.draw(ctx, drawX, drawY, c.size, time + c.phase, c.seed);
        });

        ctx.globalAlpha = 1;

        // Floating bioluminescent particles (extra ambient)
        drawAmbientParticles();

        animFrame = requestAnimationFrame(animate);
    }

    /* ---- Ambient Particles ---- */
    let ambientParticles = null;

    function initAmbientParticles() {
        if (ambientParticles) return;
        ambientParticles = [];
        const count = isMobile ? 15 : 30;
        for (let i = 0; i < count; i++) {
            ambientParticles.push({
                x: Math.random() * (canvas.width || 1000),
                y: Math.random() * (canvas.height || 2000),
                r: 0.5 + Math.random() * 1.5,
                speed: 0.1 + Math.random() * 0.3,
                phase: Math.random() * Math.PI * 2,
                floatAmp: 3 + Math.random() * 8,
                isGold: false,
            });
        }
    }

    function drawAmbientParticles() {
        initAmbientParticles();

        ambientParticles.forEach(p => {
            p.y -= p.speed;
            if (p.y < -10) {
                p.y = canvas.height + 10;
                p.x = Math.random() * canvas.width;
            }

            const floatY = p.y + Math.sin(time * 0.5 + p.phase) * p.floatAmp;
            const alpha = 0.15 + Math.sin(time * 0.3 + p.phase) * 0.1;

            const color = '73, 146, 154';

            // Glow
            ctx.fillStyle = `rgba(${color}, ${alpha * 0.15})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(${color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /* ---- Cleanup ---- */
    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
        canvas.remove();
    });
}
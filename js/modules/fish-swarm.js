/* ========================================= */
/* MODULE - FISH SWARM TRANSITION            */
/* Fish + bubbles rise from deep when        */
/* scrolling. Gothic underwater atmosphere.  */
/* ========================================= */

import { debounce, cleanupRegistry } from '../utils/helpers.js';

/* ----------------------------------------- */
/* FISH SHAPES                               */
/* ----------------------------------------- */

const CREATURE_DRAW = {
    smallFish(ctx, s, glow, time) {
        const tw = Math.sin(time * 8) * s * 0.06;
        const bw = Math.sin(time * 6) * s * 0.02;
        ctx.beginPath();
        ctx.moveTo(s * 0.4, bw);
        ctx.quadraticCurveTo(s * 0.15, -s * 0.14 + bw, -s * 0.2, -s * 0.1 + bw);
        ctx.quadraticCurveTo(-s * 0.38, -s * 0.03, -s * 0.4, bw);
        ctx.quadraticCurveTo(-s * 0.38, s * 0.03, -s * 0.2, s * 0.1 - bw);
        ctx.quadraticCurveTo(s * 0.15, s * 0.14 - bw, s * 0.4, bw);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.32, bw);
        ctx.lineTo(-s * 0.5 + tw, -s * 0.1 + bw);
        ctx.lineTo(-s * 0.48 + tw * 0.5, bw);
        ctx.lineTo(-s * 0.5 + tw, s * 0.1 + bw);
        ctx.closePath();
        ctx.fill();
        // Spine (kein Gradient – einfacher Stroke)
        ctx.strokeStyle = `rgba(73,146,154,${0.2 + glow * 0.15})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s * 0.3, bw);
        ctx.quadraticCurveTo(0, s * 0.05 + bw, -s * 0.3, bw);
        ctx.stroke();
        // Eye (einfacher Punkt statt Gradient)
        ctx.fillStyle = `rgba(150,220,220,${0.5 + glow * 0.2})`;
        ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.01 + bw, s * 0.03, 0, Math.PI * 2); ctx.fill();
    },

    bigFish(ctx, s, glow, time) {
        const tw = Math.sin(time * 5) * s * 0.08;
        const bw = Math.sin(time * 4) * s * 0.03;
        ctx.beginPath();
        ctx.moveTo(s * 0.55, bw);
        ctx.quadraticCurveTo(s * 0.3, -s * 0.25 + bw * 0.5, -s * 0.2, -s * 0.15 + bw);
        ctx.quadraticCurveTo(-s * 0.45, -s * 0.08, -s * 0.5, bw);
        ctx.quadraticCurveTo(-s * 0.45, s * 0.08, -s * 0.2, s * 0.15 - bw);
        ctx.quadraticCurveTo(s * 0.3, s * 0.25 - bw * 0.5, s * 0.55, bw);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.42, bw);
        ctx.lineTo(-s * 0.72 + tw, -s * 0.22 + bw);
        ctx.quadraticCurveTo(-s * 0.55, bw, -s * 0.72 + tw, s * 0.22 + bw);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.1, -s * 0.18 + bw);
        ctx.quadraticCurveTo(-s * 0.05, -s * 0.32 + bw, -s * 0.2, -s * 0.22 + bw);
        ctx.fill();
        // Pectoral fin
        ctx.beginPath();
        ctx.moveTo(s * 0.15, s * 0.05 + bw);
        ctx.quadraticCurveTo(s * 0.05, s * 0.18 + Math.sin(time * 4) * s * 0.04 + bw, -s * 0.05, s * 0.12 + bw);
        ctx.fill();
        // Spine (kein Gradient)
        ctx.strokeStyle = `rgba(73,146,154,${0.25 + glow * 0.15})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s * 0.45, bw);
        ctx.quadraticCurveTo(s * 0.15, -s * 0.05 + bw, -s * 0.4, bw);
        ctx.stroke();
        // Eye (einfacher Punkt)
        ctx.fillStyle = `rgba(150,220,220,${0.6 + glow * 0.2})`;
        ctx.beginPath(); ctx.arc(s * 0.35, -s * 0.02 + bw, s * 0.04, 0, Math.PI * 2); ctx.fill();
    },
};

const TYPES = ['smallFish','smallFish','smallFish','smallFish','smallFish','smallFish','bigFish','bigFish','bigFish','bigFish'];

function drawCreature(ctx, x, y, size, angle, glow, type, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = type === 'bigFish'
        ? `rgba(25,55,65,${0.55 + glow * 0.12})`
        : `rgba(35,80,95,${0.5 + glow * 0.15})`;
    CREATURE_DRAW[type](ctx, size, glow, time);
    ctx.restore();
}

/* ----------------------------------------- */
/* BUBBLE DRAWING                            */
/* ----------------------------------------- */

function drawBubble(ctx, x, y, r, opacity) {
    // Outer ring
    ctx.strokeStyle = `rgba(73,146,154,${opacity * 0.6})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    // Highlight
    ctx.fillStyle = `rgba(150,220,220,${opacity * 0.4})`;
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.25, 0, Math.PI * 2);
    ctx.fill();
}

/* ----------------------------------------- */
/* MODULE INIT                               */
/* ----------------------------------------- */

export function initFishSwarm() {
    const isMobile = window.innerWidth <= 768;
    const SWARM_SIZE = isMobile ? 25 : 45;
    const COOLDOWN = 3000; // ms between triggers

    const canvas = document.createElement('canvas');
    canvas.className = 'fish-swarm-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:50;pointer-events:none;opacity:0;transition:opacity 0.8s ease';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let animFrame = null, isActive = false, time = 0;
    let creatures = [], bubbles = [], trailParticles = [];
    let swarmHideTimer = null, lastTriggerTime = 0;
    let lastScrollY = window.scrollY, scrollDirection = 'down', lastSectionId = null;
    let lastFrameTime = 0;

    /* ----------------------------------------- */
    /* LARGE VIEWPORT LOW-RES RENDERING (2056px-) */
    /* This is the SAME strategy already used by   */
    /* particle-rain.js: the fixed full-screen     */
    /* canvas is rendered at a reduced internal    */
    /* resolution and CSS stretches it to fill the */
    /* viewport. This cuts per-frame fill-rate     */
    /* (clearRect + all draw calls) ~4-8x on huge  */
    /* viewports while keeping fish, bubbles and   */
    /* trails fully enabled and visible.           */
    /* ----------------------------------------- */
    const vw = window.innerWidth;
    const isLarge = vw >= 2056;
    const isXLarge = vw >= 3000;
    const SCALE = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;

    // Logical (CSS-pixel) viewport size. The simulation runs in this space;
    // a SCALE transform maps it onto the reduced backing store.
    let logicalW = window.innerWidth, logicalH = window.innerHeight;

    function resize() {
        logicalW = window.innerWidth;
        logicalH = window.innerHeight;
        canvas.width = Math.max(1, Math.ceil(logicalW * SCALE));
        canvas.height = Math.max(1, Math.ceil(logicalH * SCALE));
    }
    resize();
    window.addEventListener('resize', debounce(resize, 200));

    /* ---- Section Tracking ---- */
    const sections = document.querySelectorAll('section[id]');
    if (sections.length > 0) lastSectionId = sections[0].id;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.id;
                if (id && id !== lastSectionId) {
                    const cy = window.scrollY;
                    scrollDirection = cy > lastScrollY ? 'down' : 'up';
                    lastScrollY = cy;
                    lastSectionId = id;
                    triggerSwarm();
                }
            }
        });
    }, { threshold: 0.15, rootMargin: '-5% 0px -5% 0px' });
    sections.forEach(s => observer.observe(s));

    // Track scroll position continuously
    window.addEventListener('scroll', () => {
        const cy = window.scrollY;
        scrollDirection = cy > lastScrollY ? 'down' : 'up';
        lastScrollY = cy;
    }, { passive: true });

    // Also listen for hashchange (nav clicks)
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.replace('#', '');
        if (hash && hash !== lastSectionId) {
            const targetEl = document.getElementById(hash);
            if (targetEl) {
                const targetTop = targetEl.getBoundingClientRect().top + window.scrollY;
                const currentScroll = window.scrollY;
                scrollDirection = targetTop > currentScroll ? 'down' : 'up';
                lastScrollY = currentScroll;
            }
            lastSectionId = hash;
            setTimeout(() => triggerSwarm(), 50);
        }
    });

    /* ---- Trigger with cooldown ---- */
    function triggerSwarm() {
        const now = Date.now();
        if (now - lastTriggerTime < COOLDOWN) return;
        lastTriggerTime = now;

        creatures = [];
        bubbles = [];
        trailParticles = [];
        time = 0;
        isActive = true;
        lastFrameTime = 0;

        clearTimeout(swarmHideTimer);
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

        spawnCreatures();
        spawnBubbles();
        animate(performance.now());

        canvas.style.opacity = '1';
    }

    /* ---- Determine swarm size based on viewport ---- */
    function getSwarmSize() {
        if (window.innerWidth <= 480) return 8;
        if (window.innerWidth <= 768) return 12;
        if (window.innerWidth <= 1200) return 18;
        if (window.innerWidth <= 2560) return 25;
        if (window.innerWidth <= 3840) return 20;
        return 15;
    }

    /* ---- Spawn fish ---- */
    function spawnCreatures() {
        creatures = [];
        const w = logicalW, h = logicalH;
        const count = getSwarmSize();
        const goDown = false;
        const cols = Math.ceil(count / 5);
        for (let i = 0; i < count; i++) {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            const size = type === 'smallFish' ? 5 + Math.random() * 8 : 12 + Math.random() * 18;
            const col = Math.floor(i / 5), row = i % 5;
            const sx = w * 0.03 + (col / Math.max(cols - 1, 1)) * w * 0.94 + (Math.random() - 0.5) * w * 0.1;
            const sy = h + size * 3 + Math.random() * 100 + row * 40;
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.2;
            creatures.push({
                x: sx, y: sy, size, type, angle, baseAngle: angle, goDown,
                speed: 80 + Math.random() * 160,
                phase: Math.random() * Math.PI * 2, wobbleAmp: 3 + Math.random() * 6,
                wobbleSpeed: 1.2 + Math.random() * 2,
                delay: col * 0.12 + Math.random() * 0.2, opacity: 0,
            });
        }
    }

    /* ---- Spawn bubbles ---- */
    function spawnBubbles() {
        bubbles = [];
        const w = logicalW, h = logicalH;
        for (let i = 0; i < 15; i++) {
            bubbles.push({
                x: Math.random() * w,
                y: h + 10 + Math.random() * 100,
                r: 1 + Math.random() * 5,
                speed: 0.5 + Math.random() * 2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.04,
                wobbleAmp: 2 + Math.random() * 5,
                opacity: 0,
                maxOpacity: 0.1 + Math.random() * 0.25,
                delay: Math.random() * 1,
            });
        }
    }

    /* ---- Animate ---- */
    function animate(now) {
        if (!isActive) return;
        if (!lastFrameTime) lastFrameTime = now;
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        time += dt;
        // Clear the full backing store (already low-res on large viewports).
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Map logical (CSS-pixel) coordinates into the reduced backing store.
        // SCALE === 1 leaves the transform as identity on normal viewports.
        ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

        // Draw fish with organic swimming
        creatures.forEach(c => {
            if (time < c.delay) return;
            c.opacity = Math.min(1, (time - c.delay) * 2);

            const swimPhase = time * c.wobbleSpeed + c.phase;
            const bodyWave = Math.sin(swimPhase) * c.wobbleAmp;
            const sideDrift = Math.cos(swimPhase * 0.6) * c.wobbleAmp * 0.8;

            c.x += Math.cos(c.baseAngle) * c.speed * dt + sideDrift * dt * 3;
            c.y += Math.sin(c.baseAngle) * c.speed * dt + bodyWave * dt * 2;

            const moveAngle = Math.atan2(
                Math.sin(c.baseAngle) * c.speed + bodyWave * 2,
                Math.cos(c.baseAngle) * c.speed + sideDrift * 3
            );
            c.angle += (moveAngle - c.angle) * 0.08;
            if (!c.goDown && c.y + c.size * 0.5 < 0) { c.opacity = 0; return; }
            if (c.opacity > 0.01) {
                ctx.globalAlpha = c.opacity;
                drawCreature(ctx, c.x, c.y, c.size, c.angle, time + c.phase, c.type, time);
            }
        });

        // Draw bubbles
        bubbles.forEach(b => {
            if (time < b.delay) return;
            b.opacity = Math.min(b.maxOpacity, b.opacity + 0.008);
            b.y -= b.speed;
            b.wobble += b.wobbleSpeed;
            b.x += Math.sin(b.wobble) * b.wobbleAmp * 0.1;
            if (b.y < -20) return;
            drawBubble(ctx, b.x, b.y, b.r, b.opacity, time);
        });

        ctx.globalAlpha = 1;
        drawTrail();

        // Reset transform so later clear/state handling uses identity space.
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        let aliveFish = 0;
        for (let i = 0; i < creatures.length; i++) {
            if (creatures[i].opacity > 0.01) aliveFish++;
        }
        if (aliveFish === 0 && time > 1) {
            canvas.style.opacity = '0';
            if (time > 8) {
                isActive = false;
                if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
                return;
            }
        } else {
            canvas.style.opacity = '1';
        }

        animFrame = requestAnimationFrame(animate);
    }

    /* ---- Trail ---- */
    function drawTrail() {
        creatures.forEach(c => {
            if (c.opacity < 0.1 || Math.random() > 0.15) return;
            trailParticles.push({
                x: c.x + (Math.random() - 0.5) * c.size * 0.2,
                y: c.y + (c.goDown ? -c.size * 0.3 : c.size * 0.3),
                r: 0.5 + Math.random() * 1.2, opacity: 0.15 + Math.random() * 0.15,
                isGold: Math.random() > 0.5, life: 18 + Math.random() * 20, age: 0,
            });
        });
        trailParticles = trailParticles.filter(p => {
            p.age++;
            const a = p.opacity * (1 - p.age / p.life);
            if (a <= 0) return false;
            ctx.fillStyle = `rgba(73,146,154,${a * 0.15})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 3, 0, 6.28); ctx.fill();
            ctx.fillStyle = `rgba(73,146,154,${a})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
            return true;
        });
        if (trailParticles.length > 200) trailParticles = trailParticles.slice(-200);
    }

    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
        clearTimeout(swarmHideTimer);
        window.removeEventListener('resize', resize);
        observer.disconnect();
        canvas.remove();
    });
}
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
        // Glow spine
        ctx.strokeStyle = `rgba(201,168,97,${0.25 + glow * 0.15})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s * 0.3, bw);
        ctx.quadraticCurveTo(0, s * 0.05 + bw, -s * 0.3, bw);
        ctx.stroke();
        // Eye
        const ex = s * 0.2, ey = -s * 0.01 + bw;
        const grad = ctx.createRadialGradient(ex, ey, 0, ex, ey, s * 0.04);
        grad.addColorStop(0, `rgba(201,168,97,${0.5 + glow * 0.3})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(ex, ey, s * 0.04, 0, Math.PI * 2); ctx.fill();
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
        // Spine glow
        ctx.strokeStyle = `rgba(201,168,97,${0.3 + glow * 0.2})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(s * 0.45, bw);
        ctx.quadraticCurveTo(s * 0.15, -s * 0.05 + bw, -s * 0.4, bw);
        ctx.stroke();
        // Eye
        const ex2 = s * 0.35, ey2 = -s * 0.02 + bw;
        const g2 = ctx.createRadialGradient(ex2, ey2, 0, ex2, ey2, s * 0.06);
        g2.addColorStop(0, `rgba(201,168,97,${0.6 + glow * 0.3})`);
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.beginPath(); ctx.arc(ex2, ey2, s * 0.06, 0, Math.PI * 2); ctx.fill();
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

function drawBubble(ctx, x, y, r, opacity, time) {
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
    // Inner glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(73,146,154,${opacity * 0.05})`);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

/* ----------------------------------------- */
/* STONE RUINS (static atmospheric overlay)  */
/* ----------------------------------------- */


/* ----------------------------------------- */
/* MODULE INIT                               */
/* ----------------------------------------- */

export function initFishSwarm() {
    const isMobile = window.innerWidth <= 768;
    const SWARM_SIZE = isMobile ? 25 : 45;
    const COOLDOWN = 3000; // ms between triggers

    const canvas = document.createElement('canvas');
    canvas.className = 'fish-swarm-canvas';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.8s ease';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let animFrame = null, isActive = false, time = 0;
    let creatures = [], bubbles = [], trailParticles = [];
    let swarmHideTimer = null, lastTriggerTime = 0;
    let lastScrollY = window.scrollY, scrollDirection = 'down', lastSectionId = null;

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
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
            // Compute direction from target section position vs current scroll
            const targetEl = document.getElementById(hash);
            if (targetEl) {
                const targetTop = targetEl.getBoundingClientRect().top + window.scrollY;
                const currentScroll = window.scrollY;
                scrollDirection = targetTop > currentScroll ? 'down' : 'up';
                lastScrollY = currentScroll;
            }
            lastSectionId = hash;
            // Small delay so the smooth scroll has begun
            setTimeout(() => triggerSwarm(), 50);
        }
    });

    /* ---- Trigger with cooldown ---- */
    function triggerSwarm() {
        const now = Date.now();
        if (now - lastTriggerTime < COOLDOWN) return;
        lastTriggerTime = now;

        // FULL RESET — clear all old state to prevent fish stacking
        creatures = [];
        bubbles = [];
        trailParticles = [];
        time = 0;
        isActive = true;

        // Cancel any pending hide
        clearTimeout(swarmHideTimer);
        if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }

        spawnCreatures();
        spawnBubbles();
        animate();

        canvas.style.opacity = '1';
        // Don't auto-hide — the animate loop will hide canvas when ALL fish are off-screen
    }

    /* ---- Determine swarm size based on viewport ---- */
    function getSwarmSize() {
        if (window.innerWidth <= 480) return 15;   // small mobile
        if (window.innerWidth <= 768) return 25;   // tablet
        if (window.innerWidth <= 1200) return 35;  // small desktop
        return 45;                                  // large desktop
    }

    /* ---- Spawn fish ---- */
    function spawnCreatures() {
        creatures = [];
        const w = canvas.width, h = canvas.height;
        const count = getSwarmSize();
        // ALL fish rise from BOTTOM to TOP (going UP, -Y direction)
        const goDown = false;
        const cols = Math.ceil(count / 5);
        for (let i = 0; i < count; i++) {
            const type = TYPES[Math.floor(Math.random() * TYPES.length)];
            const size = type === 'smallFish' ? 5 + Math.random() * 8 : 12 + Math.random() * 18;
            const col = Math.floor(i / 5), row = i % 5;
            const sx = w * 0.03 + (col / Math.max(cols - 1, 1)) * w * 0.94 + (Math.random() - 0.5) * w * 0.1;
            // Always spawn below screen, move upward
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
        const w = canvas.width, h = canvas.height;
        for (let i = 0; i < 30; i++) {
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
    function animate() {
        if (!isActive) return;
        const dt = 0.016; time += dt;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw fish with organic swimming
        creatures.forEach(c => {
            if (time < c.delay) return;
            c.opacity = Math.min(1, (time - c.delay) * 2);

            // Organic swimming path: sinusoidal body wave
            const swimPhase = time * c.wobbleSpeed + c.phase;
            const bodyWave = Math.sin(swimPhase) * c.wobbleAmp;
            const sideDrift = Math.cos(swimPhase * 0.6) * c.wobbleAmp * 0.8;

            // Main movement direction
            c.x += Math.cos(c.baseAngle) * c.speed * dt + sideDrift * dt * 3;
            c.y += Math.sin(c.baseAngle) * c.speed * dt + bodyWave * dt * 2;

            // Angle follows actual movement (fish face where they swim)
            const moveAngle = Math.atan2(
                Math.sin(c.baseAngle) * c.speed + bodyWave * 2,
                Math.cos(c.baseAngle) * c.speed + sideDrift * 3
            );
            c.angle += (moveAngle - c.angle) * 0.08;
            // Remove fish only when fully off-screen (no clipping)
            // Fish body extends ±size*0.6 around center, so wait until fully past edge
            if (c.goDown && c.y - c.size * 0.5 > canvas.height) { c.opacity = 0; return; }
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

        // Check if all fish have completed their journey to the top
        const aliveFish = creatures.filter(c => c.opacity > 0.01).length;
        if (aliveFish === 0 && time > 1) {
            // Wait a moment then fade out
            canvas.style.opacity = '0';
            if (time > 8) { // Safety: max 8 seconds
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
            const col = p.isGold ? '201,168,97' : '73,146,154';
            ctx.fillStyle = `rgba(${col},${a * 0.15})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 3, 0, 6.28); ctx.fill();
            ctx.fillStyle = `rgba(${col},${a})`;
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
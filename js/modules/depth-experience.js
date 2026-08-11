/* ========================================= */
/* MODULE - FULL-PAGE DEPTH EXPERIENCE */
/* Immersive underwater gothic scroll */
/* ========================================= */
import { registerAnimation } from '../utils/animation-manager.js';

export function initDepthExperience() {
    createParticleCanvas();
    createFogOverlay();
    createVignette();
    initScrollHandlers();
}

/* ========================================= */
/* PARTICLE CANVAS */
/* ========================================= */
function createParticleCanvas() {
    const canvas = document.createElement('canvas');
    canvas.className = 'depth-particles-canvas';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d', { alpha: true });
    let particles = [];
    let bubbles = [];
    let width, height;

    const COLORS_GOLD = [201, 168, 97];
    const COLORS_CYAN = [73, 146, 154];
    const TWO_PI = 6.2832;

    let time = 0;
    let lastTime = 0;

    /* ---- Large viewport low-res buffering (2056px+) ---- */
    const vw = window.innerWidth;
    const isLarge = vw >= 2056;
    const isXLarge = vw >= 3000;
    const SCALE = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;

    function resize() {
        const logicalW = window.innerWidth;
        const logicalH = window.innerHeight;
        width = canvas.width = Math.max(1, Math.ceil(logicalW * SCALE));
        height = canvas.height = Math.max(1, Math.ceil(logicalH * SCALE));
        initParticles();
        initBubbles();
    }

    function initParticles() {
        particles = [];
        const count = Math.min(30, Math.floor(width / 45));
        for (let i = 0; i < count; i++) {
            const isGold = Math.random() > 0.5;
            const rgb = isGold ? COLORS_GOLD : COLORS_CYAN;
            particles.push({
                x: Math.random() * width,
                r: 1 + Math.random() * 2.5,
                baseY: Math.random() * height,
                floatAmp: 8 + Math.random() * 20,
                floatSpeed: 0.15 + Math.random() * 0.4,
                phase: Math.random() * TWO_PI,
                rgb: rgb,
                baseOpacity: 0.12 + Math.random() * 0.25,
                horizontalDrift: (Math.random() - 0.5) * 0.3,
            });
        }
    }

    function initBubbles() {
        bubbles = [];
        const count = Math.min(12, Math.floor(width / 80));
        for (let i = 0; i < count; i++) {
            const isGold = Math.random() > 0.4;
            const rgb = isGold ? COLORS_GOLD : COLORS_CYAN;
            bubbles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                r: 3 + Math.random() * 7,
                baseY: Math.random() * height,
                speed: 0.3 + Math.random() * 0.8,
                wobble: Math.random() * TWO_PI,
                wobbleSpeed: 0.02 + Math.random() * 0.04,
                wobbleAmp: 15 + Math.random() * 30,
                rgb: rgb,
                baseOpacity: 0.08 + Math.random() * 0.2,
                highlightOffset: 0.25 + Math.random() * 0.15,
            });
        }
    }

    resize();
    window.addEventListener('resize', resize);

    // Pause delta-time when tab hidden to prevent time jump
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) lastTime = 0;
    });
    registerAnimation((now, dt) => animate(now));

    function animate(now) {
        if (!lastTime) lastTime = now;
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;
        time += dt;

        ctx.clearRect(0, 0, width, height);

        // Particles - purely organic floating, no scroll displacement
        for (let i = 0, len = particles.length; i < len; i++) {
            const p = particles[i];
            const floatY = p.baseY + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            let drawY = ((floatY % height) + height) % height;
            let drawX = p.x;
            p.x += p.horizontalDrift;
            if (drawX < -20) drawX += width + 40;
            else if (drawX > width + 20) drawX -= width + 40;
            const opacity = p.baseOpacity * (0.6 + 0.4 * Math.sin(time * 0.4 + p.phase));
            ctx.fillStyle = `rgba(${p.rgb[0]},${p.rgb[1]},${p.rgb[2]},${opacity})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, p.r, 0, TWO_PI);
            ctx.fill();
        }

        // Bubbles - purely organic floating, no scroll displacement
        for (let i = 0, len = bubbles.length; i < len; i++) {
            const b = bubbles[i];
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
            // Bubble body
            ctx.fillStyle = `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},${opacity * 0.15})`;
            ctx.beginPath();
            ctx.arc(drawX, drawY, b.r, 0, TWO_PI);
            ctx.fill();
            // Bubble outline
            ctx.strokeStyle = `rgba(${b.rgb[0]},${b.rgb[1]},${b.rgb[2]},${opacity * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.arc(drawX, drawY, b.r, 0, TWO_PI);
            ctx.stroke();
            // Highlight
            const hx = drawX - b.r * b.highlightOffset;
            const hy = drawY - b.r * b.highlightOffset;
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.4})`;
            ctx.beginPath();
            ctx.arc(hx, hy, b.r * 0.2, 0, TWO_PI);
            ctx.fill();
        }

    }
}

/* ========================================= */
/* FOG OVERLAY */
/* ========================================= */
function createFogOverlay() {
    const fog = document.createElement('div');
    fog.className = 'depth-fog-overlay';
    fog.style.background = `
        linear-gradient(to bottom,
            rgba(10, 22, 40, 0.0) 0%,
            rgba(10, 22, 40, 0.1) 25%,
            rgba(10, 22, 40, 0.2) 50%,
            rgba(10, 22, 40, 0.3) 75%,
            rgba(10, 22, 40, 0.4) 100%
        )
    `;
    document.body.appendChild(fog);
}

/* ========================================= */
/* VIGNETTE */
/* ========================================= */
function createVignette() {
    const vignette = document.createElement('div');
    vignette.className = 'depth-vignette';
    document.body.appendChild(vignette);
}

/* ========================================= */
/* SCROLL HANDLERS */
/* ========================================= */
function initScrollHandlers() {
    let lastScrollPercent = 0;
    let ticking = false;

    const fog = document.querySelector('.depth-fog-overlay');
    const vignette = document.querySelector('.depth-vignette');

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(update);
            ticking = true;
        }
    }

    function update() {
        ticking = false;

        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = maxScroll > 0 ? scrollY / maxScroll : 0;

        if (fog) {
            if (scrollPercent > 0.02) {
                fog.classList.add('active');
                fog.style.opacity = Math.min(0.7, (scrollPercent - 0.02) / 0.6);
            } else {
                fog.classList.remove('active');
                fog.style.opacity = 0;
            }
        }

        if (vignette) {
            if (scrollPercent > 0.03) {
                vignette.classList.add('active');
                vignette.style.opacity = Math.min(1, (scrollPercent - 0.03) / 0.32);
            } else {
                vignette.classList.remove('active');
                vignette.style.opacity = 0;
            }
        }

        lastScrollPercent = scrollPercent;

        const b = Math.floor(9 + scrollPercent * 30);
        document.body.style.backgroundColor = `rgb(3, 8, ${b})`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
}

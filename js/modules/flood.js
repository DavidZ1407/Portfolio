/* ========================================= */
/* MODULE - FLOOD EFFECT */
/* ========================================= */
import { registerAnimation } from '../utils/animation-manager.js';
import { sizeCanvas } from '../utils/helpers.js';

export function initFlood() {
    const section = document.querySelector('.journey_section');
    if (!section) return;

    const oldCanvas = section.querySelector('.flood-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'flood-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 5;
        pointer-events: none;
    `;
    section.style.position = 'relative';
    section.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let unregAnim = null;
    let waterLevel = 1;
    let targetLevel = 1;
    let particles = [];
    let time = 0;
    let isAnimating = false;

    /* ---- Large viewport low-res buffering (2056px+) ---- */
    const vw = window.innerWidth;
    const isLarge = vw >= 2056;
    const isXLarge = vw >= 3000;
    const SCALE = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;

    function resize() {
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        // Cap backing store at 2560px to prevent explosion on large viewports
        const result = sizeCanvas(canvas, w, h, 2560);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }
    resize();
    window.addEventListener('resize', resize);

    function updateWater() {
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;

        if (rect.top >= viewH) { targetLevel = 1; return; }
        if (rect.bottom <= 0) { targetLevel = 0; return; }

        const scrollProgress = (viewH - rect.top) / (viewH + rect.height);
        const progress = Math.max(0, Math.min(1, scrollProgress));
        targetLevel = 1 - progress;
    }

    function initParticles() {
        particles = [];
        for (let i = 0; i < 30; i++) { // Reduced from 50
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: 2 + Math.random() * 6,
                speed: 0.3 + Math.random() * 1.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.04,
                wobbleAmp: 3 + Math.random() * 8,
                opacity: 0.2 + Math.random() * 0.6,
                glow: 8 + Math.random() * 15,
            });
        }
    }
    initParticles();

    function draw() {
        const w = canvas.width;
        const h = canvas.height;
        if (waterLevel <= 0.01) return;

        const waterH = h * waterLevel;
        const waterTop = h - waterH;
        if (waterH <= 2) return;

        // Wasser-Gradient
        const grad = ctx.createLinearGradient(0, waterTop, 0, h);
        grad.addColorStop(0, 'rgba(10, 22, 40, 0.15)');
        grad.addColorStop(0.2, 'rgba(10, 22, 40, 0.45)');
        grad.addColorStop(0.5, 'rgba(10, 22, 40, 0.65)');
        grad.addColorStop(0.8, 'rgba(10, 22, 40, 0.8)');
        grad.addColorStop(1, 'rgba(10, 22, 40, 0.9)');

        ctx.fillStyle = grad;
        ctx.fillRect(0, waterTop, w, waterH);

        // Wellenlinie
        ctx.beginPath();
        ctx.moveTo(0, waterTop);
        for (let x = 0; x <= w; x += 4) {
            const waveY = waterTop + Math.sin(x * 0.015 + time * 2) * 4
                + Math.sin(x * 0.03 + time * 1.2) * 2
                + Math.sin(x * 0.008 + time * 0.8) * 6;
            ctx.lineTo(x, waveY);
        }
        ctx.strokeStyle = 'rgba(73, 146, 154, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bl�schen - GR�SSER und MIT GLOW
        particles.forEach(p => {
            p.wobble += p.wobbleSpeed;
            p.y -= p.speed;
            if (p.y < waterTop) { p.y = h; p.x = Math.random() * w; }
            p.x += Math.sin(p.wobble) * p.wobbleAmp * 0.05;

            if (p.y >= waterTop && p.opacity > 0.05) {
                const alpha = p.opacity * waterLevel;

                // Glow-Halo (no shadowBlur - use large semi-transparent circle instead)
                ctx.fillStyle = `rgba(73, 146, 154, ${alpha * 0.08})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r + p.glow, 0, 6.2832);
                ctx.fill();

                // �u�erer Rand
                ctx.fillStyle = `rgba(73, 146, 154, ${alpha * 0.15})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                ctx.fill();

                // Helle Kontur
                ctx.strokeStyle = `rgba(150, 220, 220, ${alpha * 0.8})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, 6.2832);
                ctx.stroke();

                // Highlight-Spot
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.3, 0, 6.2832);
                ctx.fill();
            }
        });
    }

    let lastFrameTime = 0;

    function animate(now) {
        if (!isAnimating) return;
        if (!lastFrameTime) lastFrameTime = now;
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        time += dt;
        waterLevel += (targetLevel - waterLevel) * 0.12;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (waterLevel > 0.005) draw();
        
    }

    // Only animate when section is visible
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isAnimating) {
                isAnimating = true;
                lastFrameTime = 0;
                unregAnim = registerAnimation((now, dt) => animate(now));
            } else if (!entry.isIntersecting) {
                isAnimating = false;
                if (unregAnim) {
                    unregAnim();
                    unregAnim = null;
                }
            }
        });
    }, { threshold: 0.05 });
    observer.observe(section);

    window.addEventListener('scroll', updateWater, { passive: true });
    updateWater();

    return () => {
        window.removeEventListener('scroll', updateWater);
        observer.disconnect();
        if (unregAnim) unregAnim();
        canvas.remove();
    };
}

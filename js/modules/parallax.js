import { registerAnimation } from '../utils/animation-manager.js';
/* ========================================= */
/* PARALLAX MODULE */
/* ========================================= */

/**
 * Parallax + Partikel komplett jitterfrei via Canvas.
 * 
 * Architektur:
 * 1. Parallax-Layers (bg, mid) werden nur beim Scrollen transformiert
 * 2. Partikel/Blasen/Fische werden auf einem Canvas gerendert –
 *    komplett unabhängig vom DOM-Layout und GPU-Compositing
 * 3. Canvas-Layer wird NICHT vom Scroll-CSS betroffen
 */

let parallaxRafId = null;
let parallaxRunning = false;

export function initParallax() {
    const bgLayer = document.querySelector('.parallax-bg');
    const midLayer = document.querySelector('.parallax-mid');
    const underwaterLayer = document.querySelector('.underwater-layer');
    const waterSurface = document.querySelector('.water-surface');
    const castleLayer = document.querySelector('.castle-layer');
    
    const bgSpeed = 0.10;
    const midSpeed = 0.30;
    const underwaterThreshold = 0.3;
    const castleThreshold = 0.5;
    
    let currentScroll = 0;
    let targetScroll = 0;
    let maxScroll = 1;
    
    /* ========================================= */
    /* CANVAS for particles/bubbles/fish         */
    /* ========================================= */
    let canvas = document.querySelector('.particles-canvas');
    if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.className = 'particles-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 3;
        `;
        document.body.appendChild(canvas);
    }
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    
    // Particle state
    const particles = [];
    const bubbles = [];
    const fishes = [];
    
    function roundPx(value) {
        return Math.round(value * 10) / 10;
    }
    
    function updateMaxScroll() {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) maxScroll = 1;
    }
    
    updateMaxScroll();
    
    /* ========================================= */
    /* LOOP 1: Parallax (scroll-only)            */
    /* ========================================= */
    function updateParallax() {
        const diff = targetScroll - currentScroll;
        
        if (Math.abs(diff) < 0.5) {
            currentScroll = targetScroll;
            applyParallax(currentScroll);
            parallaxRunning = false;
            return;
        }
        
        currentScroll += diff * 0.08;
        applyParallax(currentScroll);
        
        parallaxRafId = requestAnimationFrame(updateParallax);
    }
    
    function applyParallax(scroll) {
        const scrollPercent = scroll / maxScroll;
        
        if (bgLayer) {
            bgLayer.style.transform = `translate3d(0, ${roundPx(scrollPercent * 100 * bgSpeed)}px, 0)`;
        }
        if (midLayer) {
            midLayer.style.transform = `translate3d(0, ${roundPx(scrollPercent * 100 * midSpeed)}px, 0)`;
        }
        
        if (underwaterLayer) {
            underwaterLayer.classList.toggle('active', scrollPercent > underwaterThreshold);
        }
        if (waterSurface) {
            const showSurface = scrollPercent > underwaterThreshold - 0.05 && 
                scrollPercent < underwaterThreshold + 0.1;
            waterSurface.classList.toggle('active', showSurface);
        }
        if (castleLayer) {
            castleLayer.classList.toggle('active', scrollPercent > castleThreshold);
        }
    }
    
    function startParallaxLoop() {
        if (!parallaxRunning) {
            parallaxRunning = true;
            parallaxRafId = requestAnimationFrame(updateParallax);
        }
    }
    
    function onScroll() {
        targetScroll = window.pageYOffset;
        startParallaxLoop();
    }
    
    function onResize() {
        updateMaxScroll();
        resizeCanvas();
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    
    /* ========================================= */
    /* LOOP 2: Canvas particles (pausable)       */
    /* ========================================= */
    let particleRunning = false;
    
    // Pause when tab hidden for performance
    function onVisibilityChange() {
        if (document.hidden) {
            particleRunning = false;
            particleRunning = false;
        } else {
            if (!particleRunning) { particleRunning = true; }
        }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    function drawParticles(time) {
        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            
            p.phase += 0.015;
            const driftX = Math.sin(p.phase) * 0.15;
            const driftY = Math.cos(p.phase * 0.7) * 0.1 - 0.08;
            
            p.x += driftX + p.vx;
            p.y += driftY + p.vy;
            
            // Wrap
            if (p.y < -5) p.y = canvas.height + 5;
            if (p.y > canvas.height + 5) p.y = -5;
            if (p.x < -5) p.x = canvas.width + 5;
            if (p.x > canvas.width + 5) p.x = -5;
            
            const opacity = 0.15 + (Math.sin(p.phase * 2) * 0.5 + 0.5) * 0.45;
            
            // Glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r + 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${opacity * 0.1})`;
            ctx.fill();
            
            // Main dot
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${p.color}, ${opacity})`;
            ctx.fill();
        }
    }
    
    function drawBubbles(time) {
        for (let i = 0; i < bubbles.length; i++) {
            const b = bubbles[i];
            
            b.y -= b.speed;
            b.swayPhase += 0.02;
            const swayX = Math.sin(b.swayPhase) * 2;
            
            let opacity = 0;
            if (b.y > canvas.height * 0.8) {
                opacity = (canvas.height - b.y) / (canvas.height * 0.2);
            } else if (b.y < canvas.height * 0.1) {
                opacity = b.y / (canvas.height * 0.1);
            } else {
                opacity = 0.5;
            }
            opacity = Math.max(0, Math.min(0.5, opacity));
            
            // Reset
            if (b.y < -20) {
                b.y = canvas.height + 20;
                b.x = Math.random() * canvas.width;
                b.speed = 0.5 + Math.random() * 1;
                b.swayPhase = Math.random() * Math.PI * 2;
            }
            
            const bx = b.x + swayX;
            
            // Outer ring
            ctx.beginPath();
            ctx.arc(bx, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(73, 146, 154, ${opacity * 0.6})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
            
            // Highlight
            ctx.beginPath();
            ctx.arc(bx - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.25, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150, 220, 220, ${opacity * 0.4})`;
            ctx.fill();
        }
    }
    
    function drawFishes(time) {
        for (let i = 0; i < fishes.length; i++) {
            const f = fishes[i];
            
            f.phase += f.speed;
            f.x += f.direction * f.swimSpeed;
            
            const wobble = Math.sin(f.phase) * f.wobbleAmp;
            const fy = f.y + wobble;
            
            // Reset
            if (f.direction > 0 && f.x > canvas.width + 20) {
                f.x = -20;
                f.y = canvas.height * 0.2 + Math.random() * canvas.height * 0.4;
            } else if (f.direction < 0 && f.x < -20) {
                f.x = canvas.width + 20;
                f.y = canvas.height * 0.2 + Math.random() * canvas.height * 0.4;
            }
            
            // Fish shape
            const s = f.size;
            const tailWag = Math.sin(time * 0.005 + f.phase) * s * 0.15;
            
            ctx.save();
            ctx.translate(f.x, fy);
            ctx.scale(f.direction, 1);
            ctx.globalAlpha = 0.25;
            
            // Body
            ctx.fillStyle = 'rgba(35, 80, 95, 0.8)';
            ctx.beginPath();
            ctx.moveTo(s * 0.5, 0);
            ctx.quadraticCurveTo(s * 0.25, -s * 0.2, -s * 0.3, -s * 0.12);
            ctx.quadraticCurveTo(-s * 0.45, 0, -s * 0.3, s * 0.12);
            ctx.quadraticCurveTo(s * 0.25, s * 0.2, s * 0.5, 0);
            ctx.fill();
            
            // Tail
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, 0);
            ctx.lineTo(-s * 0.5 + tailWag, -s * 0.12);
            ctx.lineTo(-s * 0.5 + tailWag * 0.5, 0);
            ctx.lineTo(-s * 0.5 + tailWag, s * 0.12);
            ctx.closePath();
            ctx.fill();
            
            // Spine glow
            ctx.strokeStyle = 'rgba(201, 168, 97, 0.3)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(s * 0.4, 0);
            ctx.quadraticCurveTo(0, s * 0.03, -s * 0.35, 0);
            ctx.stroke();
            
            // Eye
            ctx.fillStyle = 'rgba(201, 168, 97, 0.5)';
            ctx.beginPath();
            ctx.arc(s * 0.3, -s * 0.01, s * 0.035, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.globalAlpha = 1;
            ctx.restore();
        }
    }
    
    function particleLoop(time) { ctx.clearRect(0, 0, canvas.width, canvas.height); drawParticles(time); drawBubbles(time); drawFishes(time); }
    
    /* ========================================= */
    /* INIT                                     */
    /* ========================================= */
    initParticles(particles);
    initBubbles(bubbles);
    initFishes(fishes);
    
    particleRunning = true; const unregisterParticles = registerAnimation((now) => { if (!particleRunning) return; particleLoop(now); });
    
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        document.removeEventListener('visibilitychange', onVisibilityChange);
        if (parallaxRafId) cancelAnimationFrame(parallaxRafId);
        unregisterParticles();
        parallaxRunning = false;
        particleRunning = false;
        if (canvas) canvas.remove();
    };
}

/* ========================================= */
/* PARTICLE STATE INIT                       */
/* ========================================= */

const COLORS = [
    '73, 146, 154',   // cyan
    '201, 168, 97',   // gold
    '73, 146, 154',   // cyan
    '201, 168, 97',   // gold
    '120, 50, 50',    // blood
    '73, 146, 154',   // cyan
];

function initParticles(particles) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    for (let i = 0; i < 25; i++) {
        particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 1 + Math.random() * 2.5,
            color: COLORS[i % COLORS.length],
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.2 - 0.1,
            phase: Math.random() * Math.PI * 2,
        });
    }
}

function initBubbles(bubbles) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    for (let i = 0; i < 12; i++) {
        bubbles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: 2 + Math.random() * 5,
            speed: 0.3 + Math.random() * 0.8,
            swayPhase: Math.random() * Math.PI * 2,
        });
    }
}

function initFishes(fishes) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    
    for (let i = 0; i < 3; i++) {
        const direction = Math.random() > 0.5 ? 1 : -1;
        fishes.push({
            x: Math.random() * w,
            y: h * 0.2 + Math.random() * h * 0.4,
            size: 15 + Math.random() * 20,
            direction,
            swimSpeed: 0.3 + Math.random() * 0.5,
            wobbleAmp: 3 + Math.random() * 8,
            phase: Math.random() * Math.PI * 2,
            speed: 0.02 + Math.random() * 0.02,
        });
    }
}

export function updateParallaxHeight() {
    const parallaxContainer = document.querySelector('.parallax-container');
    if (!parallaxContainer) return;
    parallaxContainer.style.height = '100vh';
}
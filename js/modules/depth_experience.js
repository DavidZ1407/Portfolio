/* ========================================= */
/* MODULE - FULL-PAGE DEPTH EXPERIENCE */
/* Immersive underwater gothic scroll */
/* ========================================= */
import { initUnifiedParticles } from './unified_particles.js';

export function initDepthExperience() {
    // EIN gemeinsames Partikel-System (fuehrt beide alten Systeme zusammen):
    // back (z3: Fische + Parallax-Partikel/-Bubbles) + front (z7: Depth-)
    // Partikel/-Bubbles werden in EINEM registerAnimation-Loop in
    // unified-particles.js gezeichnet (Firefox-Performance, Punkt 1).
    initUnifiedParticles();
    createFogOverlay();
    createVignette();
    initScrollHandlers();
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

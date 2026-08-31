/**
 * File: depth_experience.js
 * Description: Depth experience controller: fog/vignette intensity based on scroll depth.
 */
import { initUnifiedParticles } from './unified_particles.js';

export function initDepthExperience() {
    // ONE shared particle system (merges both old systems):
    // back (z3: fish + parallax particles/bubbles) + front (z7: depth)
    // particles/bubbles are drawn in ONE registerAnimation loop in
    // unified-particles.js (Firefox performance, item 1).
    initUnifiedParticles();
    createFogOverlay();
    createVignette();
    initScrollHandlers();
}

/* FOG OVERLAY */
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

/* VIGNETTE */
function createVignette() {
    const vignette = document.createElement('div');
    vignette.className = 'depth-vignette';
    document.body.appendChild(vignette);
}

/* SCROLL HANDLERS */
function initScrollHandlers() {
    let lastScrollPercent = 0;
    let ticking = false;

    const fog = document.querySelector('.depth-fog-overlay');
    const vignette = document.querySelector('.depth-vignette');

/* ---- Scroll strength (normalized 0..1) - thresholds & ramps ---- */
    const FOG_ACTIVE_AT = 0.02;       // fog becomes visible from this progress on
    const FOG_FULL_AT = 0.62;         // (0.02 + 0.6) fog is fully on from here
    const VIGNETTE_ACTIVE_AT = 0.03;  // vignette becomes visible from this progress on
    const VIGNETTE_FULL_AT = 0.35;    // (0.03 + 0.32) vignette is fully on from here
    const FOG_MAX_OPACITY = 0.7;
    const BODY_BLUE_BASE = 9;         // blue base value of the background gradient
    const BODY_BLUE_RANGE = 30;       // increase per 1.0 scroll progress

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
            if (scrollPercent > FOG_ACTIVE_AT) {
                fog.classList.add('active');
                fog.style.opacity = Math.min(FOG_MAX_OPACITY, (scrollPercent - FOG_ACTIVE_AT) / (FOG_FULL_AT - FOG_ACTIVE_AT));
            } else {
                fog.classList.remove('active');
                fog.style.opacity = 0;
            }
        }

        if (vignette) {
            if (scrollPercent > VIGNETTE_ACTIVE_AT) {
                vignette.classList.add('active');
                vignette.style.opacity = Math.min(1, (scrollPercent - VIGNETTE_ACTIVE_AT) / (VIGNETTE_FULL_AT - VIGNETTE_ACTIVE_AT));
            } else {
                vignette.classList.remove('active');
                vignette.style.opacity = 0;
            }
        }

        lastScrollPercent = scrollPercent;

        const b = Math.floor(BODY_BLUE_BASE + scrollPercent * BODY_BLUE_RANGE);
        document.body.style.backgroundColor = `rgb(3, 8, ${b})`;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
}

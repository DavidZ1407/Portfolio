/* ========================================= */
/* PARALLAX MODULE */
/* ========================================= */

/* Parallax-Layer (bg, mid, castle etc.) werden NUR beim Scrollen
   transformiert. Die Partikel/Blasen/Fische-Canvases wurden in das
   gemeinsame System unified-particles.js ausgelagert (Punkt 1). */

let parallaxRafId = null;
let parallaxRunning = false;

export function initParallax() {
    const bgLayer = document.querySelector('.parallax-bg');
    const midLayer = document.querySelector('.parallax-mid');
    const underwaterLayer = document.querySelector('.underwater-layer');
    const waterSurface = document.querySelector('.water-surface');
    const castleLayer = document.querySelector('.castle-layer');

    const BG_SPEED = 0.10;
    const MID_SPEED = 0.30;
    const UNDERWATER_THRESHOLD = 0.3;
    const CASTLE_THRESHOLD = 0.5;

    const WATER_SURFACE_WINDOW = 0.1;   // +0.1 oberhalb des Schwellwerts
    const WATER_SURFACE_LEAD = 0.05;    // Wasseroberflaeche erscheint etwas vor dem Uebergang
    const LERP_SMOOTHING = 0.08;        // Easing-Faktor der Scroll-Naeherung
    const SNAP_EPSILON = 0.5;           // Abstand (px), ab dem die Naeherung einrastet

    let currentScroll = 0;
    let targetScroll = 0;
    let maxScroll = 1;

    function roundPx(value) {
        return Math.round(value * 10) / 10;
    }

    function updateMaxScroll() {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) maxScroll = 1;
    }

    updateMaxScroll();

    /* ---- LOOP: Parallax (scroll-only) ---- */
    function updateParallax() {
        const diff = targetScroll - currentScroll;

        if (Math.abs(diff) < SNAP_EPSILON) {
            currentScroll = targetScroll;
            applyParallax(currentScroll);
            parallaxRunning = false;
            return;
        }

        currentScroll += diff * LERP_SMOOTHING;
        applyParallax(currentScroll);

        parallaxRafId = requestAnimationFrame(updateParallax);
    }

    function applyParallax(scroll) {
        const scrollPercent = scroll / maxScroll;

        if (bgLayer) {
            bgLayer.style.transform = `translate3d(0, ${roundPx(scrollPercent * 100 * BG_SPEED)}px, 0)`;
        }
        if (midLayer) {
            midLayer.style.transform = `translate3d(0, ${roundPx(scrollPercent * 100 * MID_SPEED)}px, 0)`;
        }

        if (underwaterLayer) {
            underwaterLayer.classList.toggle('active', scrollPercent > UNDERWATER_THRESHOLD);
        }
        if (waterSurface) {
            const showSurface = scrollPercent > UNDERWATER_THRESHOLD - WATER_SURFACE_LEAD &&
                scrollPercent < UNDERWATER_THRESHOLD + WATER_SURFACE_WINDOW;
            waterSurface.classList.toggle('active', showSurface);
        }
        if (castleLayer) {
            castleLayer.classList.toggle('active', scrollPercent > CASTLE_THRESHOLD);
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
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        if (parallaxRafId) cancelAnimationFrame(parallaxRafId);
        parallaxRunning = false;
    };
}

export function updateParallaxHeight() {
    const parallaxContainer = document.querySelector('.parallax-container');
    if (!parallaxContainer) return;
    parallaxContainer.style.height = '100vh';
}

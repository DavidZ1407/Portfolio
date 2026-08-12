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

    const bgSpeed = 0.10;
    const midSpeed = 0.30;
    const underwaterThreshold = 0.3;
    const castleThreshold = 0.5;

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

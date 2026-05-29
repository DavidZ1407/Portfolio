/* ========================================= */
/* PARALLAX MODULE */
/* ========================================= */

/**
 * Initialize parallax effect with 3 layers
 * Optimized: RAF stops when page is not scrolled,
 * maxScroll is cached, particles are lightweight.
 */

let rafId = null;
let isRunning = false;

export function initParallax() {
    const bgLayer = document.querySelector('.parallax-bg');
    const midLayer = document.querySelector('.parallax-mid');
    const fgLayer = document.querySelector('.parallax-fg');
    const underwaterLayer = document.querySelector('.underwater-layer');
    const waterSurface = document.querySelector('.water-surface');
    const castleLayer = document.querySelector('.castle-layer');
    
    // Parallax speed factors
    const bgSpeed = 0.1;
    const midSpeed = 0.3;
    const fgSpeed = 0.5;
    
    // Transition thresholds
    const underwaterThreshold = 0.3;
    const castleThreshold = 0.5;
    
    let currentScroll = 0;
    let targetScroll = 0;
    let maxScroll = 1;
    let scrollChanged = false;
    
    function lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    function updateMaxScroll() {
        maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll <= 0) maxScroll = 1;
    }
    
    updateMaxScroll();
    
    function updateParallax() {
        // Only continue if scroll position has changed significantly
        if (!scrollChanged && Math.abs(currentScroll - targetScroll) < 0.5) {
            isRunning = false;
            return;
        }
        scrollChanged = false;
        
        currentScroll = lerp(currentScroll, targetScroll, 0.1);
        const scrollPercent = currentScroll / maxScroll;
        
        if (bgLayer) {
            bgLayer.style.transform = `translateY(${scrollPercent * 100 * bgSpeed}px)`;
        }
        if (midLayer) {
            midLayer.style.transform = `translateY(${scrollPercent * 100 * midSpeed}px)`;
        }
        if (fgLayer) {
            fgLayer.style.transform = `translateY(${scrollPercent * 100 * fgSpeed}px)`;
        }
        
        // Handle underwater transition
        if (underwaterLayer) {
            underwaterLayer.classList.toggle('active', scrollPercent > underwaterThreshold);
        }
        
        // Handle water surface visibility
        if (waterSurface) {
            const showSurface = scrollPercent > underwaterThreshold - 0.05 && 
                scrollPercent < underwaterThreshold + 0.1;
            waterSurface.classList.toggle('active', showSurface);
        }
        
        // Handle castle appearance
        if (castleLayer) {
            castleLayer.classList.toggle('active', scrollPercent > castleThreshold);
        }
        
        rafId = requestAnimationFrame(updateParallax);
    }
    
    function startLoop() {
        if (!isRunning) {
            isRunning = true;
            rafId = requestAnimationFrame(updateParallax);
        }
    }
    
    function onScroll() {
        targetScroll = window.pageYOffset;
        scrollChanged = true;
        startLoop();
    }
    
    function onResize() {
        updateMaxScroll();
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    
    // Create particles
    createParticles();
    createBubbles();
    createFish();
    
    // Cleanup function
    return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        if (rafId) cancelAnimationFrame(rafId);
        isRunning = false;
    };
}

/**
 * Create floating particles in foreground layer (lightweight)
 */
function createParticles() {
    const fgLayer = document.querySelector('.particles-layer');
    if (!fgLayer) return;
    
    const fragment = document.createDocumentFragment();
    const particleCount = 20; // Reduced from 25
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 6}s`;
        particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
        
        fragment.appendChild(particle);
    }
    fgLayer.appendChild(fragment);
}

/**
 * Create rising bubbles in foreground layer (lightweight)
 */
function createBubbles() {
    const fgLayer = document.querySelector('.particles-layer');
    if (!fgLayer) return;
    
    const fragment = document.createDocumentFragment();
    const bubbleCount = 10; // Reduced from 15
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * 10 + 5;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 100}%`;
        bubble.style.animationDelay = `${Math.random() * 8}s`;
        bubble.style.animationDuration = `${Math.random() * 6 + 6}s`;
        
        fragment.appendChild(bubble);
    }
    fgLayer.appendChild(fragment);
}

/**
 * Create swimming fish silhouettes
 */
function createFish() {
    const fgLayer = document.querySelector('.particles-layer');
    if (!fgLayer) return;
    
    const fragment = document.createDocumentFragment();
    const fishCount = 3; // Reduced from 5
    
    for (let i = 0; i < fishCount; i++) {
        const fish = document.createElement('div');
        fish.className = 'fish';
        
        fish.style.top = `${Math.random() * 40 + 20}%`;
        const scale = Math.random() * 0.5 + 0.5;
        fish.style.transform = `scale(${scale})`;
        fish.style.animationDelay = `${Math.random() * 12}s`;
        
        fragment.appendChild(fish);
    }
    fgLayer.appendChild(fragment);
}

/**
 * Update parallax container height for proper scrolling
 */
export function updateParallaxHeight() {
    const parallaxContainer = document.querySelector('.parallax-container');
    if (!parallaxContainer) return;
    
    // Fixed height instead of full body height (parallax container is fixed position,
    // so height doesn't affect scroll. But set it for potential use)
    parallaxContainer.style.height = '100vh';
}
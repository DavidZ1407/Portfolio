/* ========================================= */
/* MODULE - 3D PORTAL CAROUSEL */
/* Auto-rotate + click + bubbles */
/* ========================================= */

import { cleanupRegistry, debounce } from '../utils/helpers.js';

let modalOpenCallback = null;
let currentCenter = 0;
let autoTimer = null;
let isAutoCycling = false;
let isPaused = false;
let TOTAL_SLIDES = 0;
const AUTO_INTERVAL = 3500;

/**
 * Initialize the portal carousel
 * @param {Function} onOpenModal - callback(card) to open modal
 */
export function initPortal(onOpenModal) {
    modalOpenCallback = onOpenModal;
    initBubbles();
    initCarousel();
}

/* ========================================= */
/* CAROUSEL */
/* ========================================= */

function initCarousel() {
    const slides = document.querySelectorAll('.portal-slide');
    const dots = document.querySelectorAll('.c-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const section = document.querySelector('.archives_section');

    if (slides.length === 0) return;

    // Set ARIA labels on navigation buttons
    if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous slide');
    if (nextBtn) nextBtn.setAttribute('aria-label', 'Next slide');

    // Set TOTAL_SLIDES dynamically
    TOTAL_SLIDES = slides.length;

    // Set ARIA labels on slides
    slides.forEach((slide, i) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.setAttribute('aria-label', `Project ${i + 1} of ${TOTAL_SLIDES}`);
    });

    // Set initial positions
    updatePositions(slides, dots);

    let cleanupListeners = [];

    // Navigation buttons
    if (prevBtn) {
        const onPrev = () => {
            pauseAuto();
            currentCenter = (currentCenter - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        prevBtn.addEventListener('click', onPrev);
        cleanupListeners.push(() => prevBtn.removeEventListener('click', onPrev));
    }

    if (nextBtn) {
        const onNext = () => {
            pauseAuto();
            currentCenter = (currentCenter + 1) % TOTAL_SLIDES;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        nextBtn.addEventListener('click', onNext);
        cleanupListeners.push(() => nextBtn.removeEventListener('click', onNext));
    }

    // Dot clicks
    dots.forEach((dot, i) => {
        const onDotClick = () => {
            pauseAuto();
            currentCenter = i;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        dot.addEventListener('click', onDotClick);
        cleanupListeners.push(() => dot.removeEventListener('click', onDotClick));
    });

    // Click on side slides → bring to center
    slides.forEach((slide) => {
        const onSlideClick = (e) => {
            const idx = parseInt(slide.dataset.index);

            if (idx === currentCenter) {
                // Center clicked → open modal
                e.preventDefault();
                e.stopPropagation();
                pauseAuto();
                if (modalOpenCallback) {
                    modalOpenCallback(slide);
                }
                return;
            }

            // Side clicked → bring to center
            e.preventDefault();
            e.stopPropagation();
            pauseAuto();
            currentCenter = idx;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        slide.addEventListener('click', onSlideClick);
        cleanupListeners.push(() => slide.removeEventListener('click', onSlideClick));
    });

    // Keyboard navigation for slides
    slides.forEach((slide) => {
        const onKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                slide.click();
            }
        };
        slide.addEventListener('keydown', onKeydown);
        cleanupListeners.push(() => slide.removeEventListener('keydown', onKeydown));
    });

    // Start auto-cycle when visible
    let sectionObserver = null;
    if (section) {
        sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isPaused) {
                    startAuto(slides, dots);
                } else {
                    stopAuto();
                }
            });
        }, { threshold: 0.15 });
        sectionObserver.observe(section);
    }

    // Resume auto-cycle when modal closes
    function onModalClose() {
        setTimeout(() => {
            isPaused = false;
            resumeAutoAfterDelay();
        }, 200);
    }

    // ESC key
    const onEscKey = (e) => {
        if (e.key === 'Escape') onModalClose();
    };
    document.addEventListener('keydown', onEscKey);
    cleanupListeners.push(() => document.removeEventListener('keydown', onEscKey));

    // Modal overlay click for close
    const overlay = document.querySelector('.project-modal-overlay');
    if (overlay) {
        const onOverlayClick = (e) => {
            if (e.target === overlay) onModalClose();
        };
        overlay.addEventListener('click', onOverlayClick);
        cleanupListeners.push(() => overlay.removeEventListener('click', onOverlayClick));
    }

    // Close button
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) {
        const onCloseClick = () => onModalClose();
        closeBtn.addEventListener('click', onCloseClick);
        cleanupListeners.push(() => closeBtn.removeEventListener('click', onCloseClick));
    }

    // MutationObserver fallback
    let mutObs = null;
    if (overlay) {
        mutObs = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'style' && overlay.style.display === 'none') {
                    onModalClose();
                }
            });
        });
        mutObs.observe(overlay, { attributes: true, attributeFilter: ['style'] });
    }

    // Register cleanup
    cleanupRegistry.register(() => {
        stopAuto();
        cleanupListeners.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupListeners = [];
        if (sectionObserver) sectionObserver.disconnect();
        if (mutObs) mutObs.disconnect();
    });
}

function updatePositions(slides, dots) {
    slides.forEach((slide, i) => {
        // Calculate relative position
        let rel = i - currentCenter;
        if (rel < -1) rel += TOTAL_SLIDES;
        if (rel > 1) rel -= TOTAL_SLIDES;

        // Clear ALL position classes first, then add the right one
        // This ensures no "leftover" classes cause visual glitches
        slide.classList.remove('pos-center', 'pos-left', 'pos-right', 'pos-hidden');

        // Force reflow so the transition starts from the current computed position
        // (prevents the "step" effect where hidden→left→center feels like 2 jumps)
        void slide.offsetWidth;

        if (rel === 0) {
            slide.classList.add('pos-center');
            slide.setAttribute('aria-current', 'true');
        } else if (rel === -1) {
            slide.classList.add('pos-left');
            slide.removeAttribute('aria-current');
        } else if (rel === 1) {
            slide.classList.add('pos-right');
            slide.removeAttribute('aria-current');
        } else {
            slide.classList.add('pos-hidden');
            slide.removeAttribute('aria-current');
        }

        // Second reflow ensures CSS transition picks up the new class
        void slide.offsetWidth;
    });

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentCenter);
        dot.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === currentCenter) {
            dot.setAttribute('aria-current', 'true');
        } else {
            dot.removeAttribute('aria-current');
        }
    });
}

/* ---- Auto-cycle ---- */

function startAuto(slides, dots) {
    if (isAutoCycling) return;
    isAutoCycling = true;
    scheduleNext(slides, dots);
}

function stopAuto() {
    isAutoCycling = false;
    if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
    }
}

function scheduleNext(slides, dots) {
    if (!isAutoCycling) return;
    autoTimer = setTimeout(() => {
        if (!isAutoCycling) return;
        currentCenter = (currentCenter + 1) % TOTAL_SLIDES;
        updatePositions(slides, dots);
        scheduleNext(slides, dots);
    }, AUTO_INTERVAL);
}

function pauseAuto() {
    isPaused = true;
    stopAuto();
}

function resumeAutoAfterDelay() {
    // Resume auto after 8 seconds of inactivity
    isPaused = false;
    stopAuto();
    setTimeout(() => {
        if (!isPaused) {
            const slides = document.querySelectorAll('.portal-slide');
            const dots = document.querySelectorAll('.c-dot');
            startAuto(slides, dots);
        }
    }, 8000);
}

/* ========================================= */
/* BUBBLES */
/* ========================================= */

function initBubbles() {
    const canvas = document.querySelector('.portal-bubbles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = document.querySelector('.archives_section');
    let animFrame;
    let bubbles = [];
    let particles = [];
    let isActive = false;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!isActive) {
                    isActive = true;
                    resize();
                    initParticles();
                    animate();
                }
            } else {
                isActive = false;
                if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
            }
        });
    }, { threshold: 0.05 });

    observer.observe(section);

    function resize() {
        const rect = section.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
    }

    const debouncedResize = debounce(resize, 150);
    window.addEventListener('resize', debouncedResize);
    setTimeout(resize, 100);

    function initParticles() {
        bubbles = [];
        particles = [];
        const w = canvas.width;
        const h = canvas.height;

        for (let i = 0; i < 30; i++) {
            bubbles.push({
                x: Math.random() * w, y: Math.random() * h,
                r: 1 + Math.random() * 4, speed: 0.15 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.008 + Math.random() * 0.015,
                wobbleAmp: 1 + Math.random() * 3,
                opacity: 0.05 + Math.random() * 0.2,
            });
        }

        for (let i = 0; i < 40; i++) {
            const isGold = Math.random() > 0.5;
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                r: 0.5 + Math.random() * 1.5,
                color: isGold ? '201, 168, 97' : '73, 146, 154',
                floatAmp: 3 + Math.random() * 10,
                floatSpeed: 0.003 + Math.random() * 0.008,
                phase: Math.random() * Math.PI * 2,
                opacity: 0, maxOpacity: 0.2 + Math.random() * 0.4,
                delay: Math.random() * 4,
            });
        }
    }

    function animate() {
        if (!isActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const h = canvas.height;
        const time = Date.now() / 1000;

        bubbles.forEach(b => {
            b.wobble += b.wobbleSpeed;
            b.y -= b.speed;
            if (b.y < -20) { b.y = h + 20; b.x = Math.random() * canvas.width; }
            b.x += Math.sin(b.wobble) * b.wobbleAmp * 0.15;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(73, 146, 154, ${b.opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            if (b.r > 2) {
                ctx.beginPath();
                ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 230, 240, ${b.opacity * 0.5})`;
                ctx.fill();
            }
        });

        particles.forEach(p => {
            if (time < p.delay) return;
            p.opacity = Math.min(p.maxOpacity, p.opacity + 0.008);
            const floatY = p.y + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            const alpha = p.opacity * (0.5 + 0.5 * Math.sin(time * 0.3 + p.phase));
            // Glow halo
            ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.1})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 5, 0, 6.2832);
            ctx.fill();
            // Main particle
            ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, 6.2832);
            ctx.fill();
        });

        animFrame = requestAnimationFrame(animate);
    }

    // Register cleanup for bubbles
    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
    });
}
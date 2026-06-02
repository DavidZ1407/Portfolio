/* ========================================= */
/* SMOOTH ANIMATION UTILITIES */
/* Inspired by lusion.co - ultra-smooth transitions */
/* ========================================= */

/**
 * Custom Easing Functions
 * Für seidig-weiche Übergänge statt linearer Bewegung
 */
export const Easing = {
    /** Decelerates smoothly to zero (ease-out quad) */
    outQuad: t => t * (2 - t),
    
    /** Smooth deceleration (ease-out cubic) */
    outCubic: t => 1 - Math.pow(1 - t, 3),
    
    /** Very smooth deceleration (ease-out quart) */
    outQuart: t => 1 - Math.pow(1 - t, 4),
    
    /** Extra smooth landing (ease-out quint) */
    outQuint: t => 1 - Math.pow(1 - t, 5),
    
    /** Expo out - ultra smooth, lusion-like landing */
    outExpo: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    
    /** Expo in-out - smooth start and landing */
    inOutExpo: t => {
        if (t === 0 || t === 1) return t;
        return t < 0.5 
            ? Math.pow(2, 10 * (t * 2 - 1)) / 2
            : (2 - Math.pow(2, -10 * (t * 2 - 1))) / 2;
    },
    
    /** Soft spring overshoot (ease-out back) */
    outBack: t => {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    
    /** Elastic bounce (subtle) */
    outElastic: t => {
        if (t === 0 || t === 1) return t;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
    },
};

/**
 * Smooth interpolation with progress tracking
 * @param {number} current - Current value
 * @param {number} target - Target value  
 * @param {number} speed - Speed factor (0.01-0.2), lower = smoother
 * @returns {number} Interpolated value
 */
export function smoothLerp(current, target, speed = 0.06) {
    const diff = target - current;
    if (Math.abs(diff) < 0.001) return target;
    return current + diff * speed;
}

/**
 * Eased lerp with custom timing function
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Normalized progress (0-1)
 * @param {Function} ease - Easing function (default: outCubic)
 * @returns {number}
 */
export function easedLerp(start, end, t, ease = Easing.outCubic) {
    return start + (end - start) * ease(t);
}

/**
 * Smooth damped spring physics (like lusion's elastic feel)
 * @param {number} target - Target value
 * @param {Object} state - Current state object {value, velocity}
 * @param {number} stiffness - Spring stiffness (0-1)
 * @param {number} damping - Damping factor (0-1)
 * @returns {number} New value
 */
export function smoothSpring(target, state, stiffness = 0.08, damping = 0.85) {
    const force = (target - state.value) * stiffness;
    state.velocity += force;
    state.velocity *= damping;
    state.value += state.velocity;
    return state.value;
}

/**
 * Stagger delay helper for sequential animations
 * @param {number} index - Element index
 * @param {number} baseDelay - Base delay in ms
 * @param {number} stagger - Additional delay per index in ms
 * @returns {number} Total delay in ms
 */
export function staggerDelay(index, baseDelay = 0, stagger = 80) {
    return baseDelay + index * stagger;
}

/**
 * Apply staggered reveal to elements with IntersectionObserver
 * @param {string|NodeList} elements - CSS selector or NodeList
 * @param {Object} options - { threshold, stagger, initialClass, visibleClass }
 * @returns {IntersectionObserver}
 */
export function initStaggeredReveal(elements, options = {}) {
    const {
        threshold = 0.15,
        stagger = 80,
        initialClass = 'reveal-hidden',
        visibleClass = 'reveal-visible',
        rootMargin = '0px 0px -40px 0px',
    } = options;

    const items = typeof elements === 'string' 
        ? document.querySelectorAll(elements) 
        : elements;
    
    if (!items || items.length === 0) return null;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = Array.from(items).indexOf(entry.target);
                const delay = staggerDelay(index, 0, stagger);
                
                entry.target.style.transitionDelay = `${delay}ms`;
                entry.target.style.transition = `opacity 0.8s ${Easing.outCubic.name || 'cubic-bezier(0.25, 0.1, 0.25, 1)'}, transform 0.8s ${Easing.outCubic.name || 'cubic-bezier(0.25, 0.1, 0.25, 1)'}`;
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                entry.target.classList.remove(initialClass);
                entry.target.classList.add(visibleClass);
                
                observer.unobserve(entry.target);
            }
        });
    }, { threshold, rootMargin });

    items.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.classList.add(initialClass);
        observer.observe(item);
    });

    return observer;
}
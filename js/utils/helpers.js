//File: helpers.js
//Description: Shared utilities: debounce/throttle, canvas sizing/quality helpers, and a cleanup registry for animations.


import { CANVAS_BACKING_MAX_WIDTH, DEBOUNCE_DELAY_MS, THROTTLE_INTERVAL_MS, LARGE_BREAKPOINT_PX, XLARGE_BREAKPOINT_PX } from '../constants/ui.js';

//SHARED UTILITY HELPERS 
///Minimum distance (px) for a horizontal gesture to count as a swipe
const SWIPE_THRESHOLD_PX = 60;

/**
 * Viewport-based quality tier for canvas effects.
 * On large viewports (2056px+) low-resolution buffering is used,
 * on extra-large ones (3000px+) reduced even further (performance).
 *
 * @returns {{ isLarge: boolean, isXLarge: boolean, scale: number }}
 *   scale = internal render scale (< 1 on large viewports, otherwise 1).
 */
export function getCanvasQuality() {
    const vw = window.innerWidth;
    const isLarge = vw >= LARGE_BREAKPOINT_PX;
    const isXLarge = vw >= XLARGE_BREAKPOINT_PX;
    const scale = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;
    return { isLarge, isXLarge, scale };
}

/**
 *
 * @param {Element} el - 
 * @param {Function} onSwipeNext 
 * @param {Function} onSwipePrev 
 * @param {Function} [onSwipeDone] 
 * @returns {Function} 
 */
export function bindHorizontalSwipe(el, onSwipeNext, onSwipePrev, onSwipeDone) {
    if (!el || typeof el.addEventListener !== 'function') return () => {};
    let startX = 0;
    let startY = 0;
    let swiping = false;

    const onTouchStart = (e) => {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swiping = true;
    };

    //Swip Horizontal and Vertical
    const onTouchEnd = (e) => {
        if (!swiping) return;
        swiping = false;
        const touch = e.changedTouches && e.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) > SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) onSwipeNext();
            else onSwipePrev();
            if (onSwipeDone) onSwipeDone();
        }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchend', onTouchEnd);
    };
}

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = DEBOUNCE_DELAY_MS) {
    let timer = null;
    return function (...args) {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
            timer = null;
        }, delay);
    };
}

/**
 * Throttle a function (runs at most once per interval)
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Minimum interval in ms
 * @returns {Function} Throttled function
 */
export function throttle(fn, interval = THROTTLE_INTERVAL_MS) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= interval) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}

/**
 * Optimized canvas sizing for performance
 * Caps backing store at maxWidth to prevent explosion on large viewports
 * @param {HTMLCanvasElement} canvas - Canvas element to size
 * @param {number} logicalWidth - Logical CSS width
 * @param {number} logicalHeight - Logical CSS height
 * @param {number} maxWidth - Maximum backing store width (default 2560)
 * @returns {{width: number, height: number}} Actual backing store dimensions
 */
export function sizeCanvas(canvas, logicalWidth, logicalHeight, maxWidth = CANVAS_BACKING_MAX_WIDTH) {
    const scale = Math.min(1, maxWidth / Math.max(logicalWidth, 1));
    const width = Math.max(1, Math.ceil(logicalWidth * scale));
    const height = Math.max(1, Math.ceil(logicalHeight * scale));
    canvas.width = width;
    canvas.height = height;
    return { width, height, scale };
}

/**
 * Centralized cleanup registry
 * Allows modules to register cleanup callbacks that will be called on page unload
 */
class CleanupRegistry {
    constructor() {
        this.cleanups = [];
        this._boundCleanup = null;
    }

    /**
     * Register a cleanup function
     * @param {Function} fn - Cleanup function
     */
    register(fn) {
        if (typeof fn === 'function') {
            this.cleanups.push(fn);
        }
    }

    /**
     * Run all registered cleanup functions
     */
    runAll() {
        this.cleanups.forEach(fn => {
            try { fn(); } catch (e) { /* ignore cleanup errors */ }
        });
        this.cleanups = [];
    }

    /**
     * Bind cleanup to beforeunload event
     */
    bind() {
        if (this._boundCleanup) return;
        this._boundCleanup = () => this.runAll();
        window.addEventListener('beforeunload', this._boundCleanup);
    }

    /**
     * Unbind cleanup from beforeunload
     */
    unbind() {
        if (this._boundCleanup) {
            window.removeEventListener('beforeunload', this._boundCleanup);
            this._boundCleanup = null;
        }
    }
}

// Singleton instance
export const cleanupRegistry = new CleanupRegistry();

/**
 * Safely query a DOM element with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {Element|null} The element or null
 */
export function safeQuerySelector(selector, context = document) {
    try {
        return context.querySelector(selector);
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return null;
    }
}

/**
 * Safely query all DOM elements with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [context=document] - Context element
 * @returns {NodeList|Array} The elements or empty array
 */
export function safeQuerySelectorAll(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return [];
    }
}

/**
 * Get element or throw with descriptive message (for critical elements)
 * @param {string} selector - CSS selector
 * @param {string} [name] - Element name for error message
 * @returns {Element}
 */
export function requireElement(selector, name = selector) {
    const el = document.querySelector(selector);
    if (!el) {
        console.warn(`Required element not found: ${name} (selector: ${selector})`);
    }
    return el;
}


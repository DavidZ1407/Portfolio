/* ========================================= */
/* SHARED UTILITY HELPERS */
/* Debounce, Cleanup Registry, etc. */
/* ========================================= */

/**
 * Creates a debounced version of a function
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in ms
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay = 150) {
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
export function throttle(fn, interval = 50) {
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

/**
 * Set multiple attributes on an element at once
 * @param {Element} el - Target element
 * @param {Object} attrs - Key/value pairs of attributes
 */
export function setAttributes(el, attrs) {
    if (!el) return;
    Object.entries(attrs).forEach(([key, value]) => {
        el.setAttribute(key, value);
    });
}
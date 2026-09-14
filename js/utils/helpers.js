/* ==========================================================================
   FILE: js/utils/helpers.js
   DESCRIPTION: Shared utilities: debounce/throttle, canvas sizing and quality helpers, font loading, and a cleanup registry for animations.
   ========================================================================== */

import { CANVAS_BACKING_MAX_WIDTH, DEBOUNCE_DELAY_MS, THROTTLE_INTERVAL_MS, LARGE_BREAKPOINT_PX, XLARGE_BREAKPOINT_PX } from '../constants/ui.js';


const SWIPE_THRESHOLD_PX = 60;


export function getCanvasQuality() {
    const vw = window.innerWidth;
    const isLarge = vw >= LARGE_BREAKPOINT_PX;
    const isXLarge = vw >= XLARGE_BREAKPOINT_PX;
    const scale = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;
    return { isLarge, isXLarge, scale };
}


export function bindHorizontalSwipe(el, onSwipeNext, onSwipePrev, onSwipeDone) {
    if (!el || typeof el.addEventListener !== 'function') return () => { };
    let startX = 0;
    let startY = 0;
    let swiping = false;

    const onTouchStart = (e) => {
        if (!e.touches || !e.touches[0]) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        swiping = true;
    };


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


export function sizeCanvas(canvas, logicalWidth, logicalHeight, maxWidth = CANVAS_BACKING_MAX_WIDTH) {
    const scale = Math.min(1, maxWidth / Math.max(logicalWidth, 1));
    const width = Math.max(1, Math.ceil(logicalWidth * scale));
    const height = Math.max(1, Math.ceil(logicalHeight * scale));
    canvas.width = width;
    canvas.height = height;
    return { width, height, scale };
}


class CleanupRegistry {
    constructor() {
        this.cleanups = [];
        this._boundCleanup = null;
    }


    register(fn) {
        if (typeof fn === 'function') {
            this.cleanups.push(fn);
        }
    }


    runAll() {
        this.cleanups.forEach(fn => {
            try { fn(); } catch (e) { }
        });
        this.cleanups = [];
    }


    bind() {
        if (this._boundCleanup) return;
        this._boundCleanup = () => this.runAll();
        window.addEventListener('beforeunload', this._boundCleanup);
    }


    unbind() {
        if (this._boundCleanup) {
            window.removeEventListener('beforeunload', this._boundCleanup);
            this._boundCleanup = null;
        }
    }
}


export const cleanupRegistry = new CleanupRegistry();


export function safeQuerySelector(selector, context = document) {
    try {
        return context.querySelector(selector);
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return null;
    }
}


export function safeQuerySelectorAll(selector, context = document) {
    try {
        return context.querySelectorAll(selector);
    } catch (e) {
        console.warn(`Invalid selector: ${selector}`, e);
        return [];
    }
}


export function requireElement(selector, name = selector) {
    const el = document.querySelector(selector);
    if (!el) {
        console.warn(`Required element not found: ${name} (selector: ${selector})`);
    }
    return el;
}


export function waitForFont(font = '') {


    const resolveSoon = () => Promise.resolve();

    if (typeof document === 'undefined' || !document.fonts) return resolveSoon();
    if (!document.fonts.load) return resolveSoon();

    try {


        const family = (font.split(',')[0] || '').trim().replace(/^['"]|['"]$/g, '');
        if (!family) return resolveSoon();



        return document.fonts.load(font, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789').then(() => {

            return undefined;
        }).catch(() => {



            const ready = document.fonts.ready;
            if (ready && ready.then) return ready.then(() => undefined);
            return undefined;
        });
    } catch (e) {
        return resolveSoon();
    }
}


/* ========================================= */
/* MODULE - LANGUAGE SWITCH (EN/DE) */
/* ========================================= */

import { translations } from '../constants/translations.js';

const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANG = 'en';

let currentLang = DEFAULT_LANG;

/**
 * Initialize language system
 * - Detects saved language or browser language
 * - Sets up the toggle button
 */
export function initLanguage() {
    // Try to load saved language
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
        currentLang = saved;
    } else {
        // Default to English as requested
        currentLang = DEFAULT_LANG;
    }

    // Apply translations
    applyLanguage(currentLang);

    // Setup toggle button
    setupToggle();

    // Expose for potential debugging
    if (typeof window !== 'undefined') {
        window.__currentLang = currentLang;
    }
}

/**
 * Get current language code
 */
export function getCurrentLang() {
    return currentLang;
}

/**
 * Apply language to all elements with data-i18n attributes
 */
function applyLanguage(lang) {
    const texts = translations[lang];
    if (!texts) return;

    // 1. Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });

    // 2. Update elements with data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (texts[key]) {
            el.placeholder = texts[key];
        }
    });

    // 3. Update elements with data-i18n-alt
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.dataset.i18nAlt;
        if (texts[key]) {
            el.alt = texts[key];
        }
    });

    // 4. Update language toggle button state
    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        const nextLang = lang === 'en' ? 'de' : 'en';
        langBtn.textContent = texts[`lang-${nextLang}`];
        langBtn.dataset.nextLang = nextLang;
    }

    currentLang = lang;
}

/**
 * Toggle between EN and DE
 */
function toggleLanguage() {
    const nextLang = currentLang === 'en' ? 'de' : 'en';
    currentLang = nextLang;
    localStorage.setItem(STORAGE_KEY, nextLang);
    applyLanguage(nextLang);
}

/**
 * Create and setup the toggle button in the navbar
 */
function setupToggle() {
    // Check if button already exists
    let langBtn = document.getElementById('lang-toggle');
    if (!langBtn) {
        // Create button
        langBtn = document.createElement('button');
        langBtn.id = 'lang-toggle';
        langBtn.className = 'lang-toggle-btn';
        langBtn.setAttribute('aria-label', 'Switch language');
        
        // Find navbar and append
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.appendChild(langBtn);
        } else {
            // Fallback: append to header
            const header = document.querySelector('.header');
            if (header) header.appendChild(langBtn);
        }
    }

    // Set initial text
    const texts = translations[currentLang];
    const nextLang = currentLang === 'en' ? 'de' : 'en';
    langBtn.textContent = texts[`lang-${nextLang}`];
    langBtn.dataset.nextLang = nextLang;

    // Remove old listener, add new one
    langBtn.removeEventListener('click', toggleLanguage);
    langBtn.addEventListener('click', toggleLanguage);
}
/* ==========================================================================
   FILE: js/modules/language.js
   DESCRIPTION: Language switching (EN/DE): applies translations to data-i18n elements, toggles the language button, and refreshes the CV link.
   ========================================================================== */

import { translations } from '../constants/translations.js?v=3';
import { cleanupRegistry } from '../utils/helpers.js';

const STORAGE_KEY = 'portfolio-lang';
const DEFAULT_LANG = 'en';


const CV_PATHS = {
    en: { href: 'assets/CV/CV_David_Zahn_EN.pdf', download: 'CV_David_Zahn_EN.pdf', aria: 'Download CV' },
    de: { href: 'assets/CV/CV_David_Zahn_DE.pdf', download: 'CV_David_Zahn_DE.pdf', aria: 'Lebenslauf herunterladen' }
};

let currentLang = DEFAULT_LANG;


export function initLanguage() {

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) {
        currentLang = saved;
    } else {
        currentLang = DEFAULT_LANG;
    }


    applyLanguage(currentLang);


    setupToggle();
}


export function getCurrentLang() {
    return currentLang;
}


function renderLangButton(langBtn, lang) {
    const nextLang = lang === 'en' ? 'de' : 'en';
    const enActive = lang === 'en';
    const deActive = lang === 'de';

    langBtn.innerHTML =
        '<i class="bx bx-globe" aria-hidden="true"></i>' +
        '<span class="lang-opt' + (enActive ? ' active' : '') + '" data-lang="en">EN</span>' +
        '<span class="lang-sep" aria-hidden="true">|</span>' +
        '<span class="lang-opt' + (deActive ? ' active' : '') + '" data-lang="de">DE</span>';

    langBtn.dataset.nextLang = nextLang;
    langBtn.setAttribute('aria-label', `Switch to ${nextLang === 'en' ? 'English' : 'Deutsch'}`);
}


function updateCVDownloadLink(lang) {
    const cvLinks = document.querySelectorAll('#cv-download-link, #cv-download-sidebar, #cv-download-menu');
    if (!cvLinks.length) return;

    const cv = CV_PATHS[lang];
    if (!cv) return;

    cvLinks.forEach(cvLink => {
        cvLink.href = cv.href;
        cvLink.download = cv.download;
        cvLink.setAttribute('aria-label', cv.aria);
    });
}


function applyLanguage(lang) {
    const texts = translations[lang];
    if (!texts) {
        console.warn(`Language not found: ${lang}`);
        return;
    }


    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (texts[key]) {
            el.textContent = texts[key];
        }
    });


    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.dataset.i18nPlaceholder;
        if (texts[key]) {
            el.placeholder = texts[key];
        }
    });


    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.dataset.i18nAlt;
        if (texts[key]) {
            el.alt = texts[key];
        }
    });


    const langBtn = document.getElementById('lang-toggle');
    if (langBtn) {
        renderLangButton(langBtn, lang);
    }


    updateCVDownloadLink(lang);

    currentLang = lang;


    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}


function toggleLanguage() {
    const nextLang = currentLang === 'en' ? 'de' : 'en';
    currentLang = nextLang;
    try {
        localStorage.setItem(STORAGE_KEY, nextLang);
    } catch (e) {

    }
    applyLanguage(nextLang);
}


function setupToggle() {

    let langBtn = document.getElementById('lang-toggle');
    if (!langBtn) {

        langBtn = document.createElement('button');
        langBtn.id = 'lang-toggle';
        langBtn.className = 'lang-toggle-btn';
        langBtn.setAttribute('aria-label', 'Switch language');


        const navbar = document.querySelector('.navbar');
        if (navbar) {
            navbar.appendChild(langBtn);
        } else {

            const header = document.querySelector('.header');
            if (header) {
                header.appendChild(langBtn);
            } else {

                document.body.appendChild(langBtn);
            }
        }
    }


    renderLangButton(langBtn, currentLang);


    langBtn.removeEventListener('click', toggleLanguage);
    langBtn.addEventListener('click', toggleLanguage);
}

/* ========================================= */
/* MAIN ENTRY POINT */
/* ========================================= */

import { initNavigation } from './modules/navigation.js';
import { initCarousel } from './modules/carousel.js';
import { generateCarouselDots } from './modules/generate-carousel-dots.js';
import { initParallax, updateParallaxHeight } from './modules/parallax.js';
import { initModal, showPopupAtCard } from './modules/modal.js';
import { initPortal } from './modules/portal.js';
import { initUnderwater } from './modules/underwater.js';
import { initFlood } from './modules/flood.js';
import { initContactRain } from './modules/contact-rain.js';
import { initDepthExperience } from './modules/depth-experience.js';
import { initLanguage, getCurrentLang } from './modules/language.js';
import { projects } from './constants/projects.js';
import { skills } from './constants/skills.js';
import { translations } from './constants/translations.js';

document.addEventListener('DOMContentLoaded', () => {
    // Language must be first (sets up data-i18n)
    initLanguage();
    
    // Generate carousel dots BEFORE initializing carousels
    generateCarouselDots();
    
    // Core navigation & layout
    initNavigation();
    initCarousel();
    initParallax();
    updateParallaxHeight();
    
    // Modal & Portal carousel
    initModal(projects);
    initPortal((card) => {
        const projectIndex = parseInt(card.dataset.project);
        if (projectIndex >= 0 && projectIndex < projects.length) {
            showPopupAtCard(projects[projectIndex], card);
        }
    });
    
    // Dynamic content rendering (language-aware)
    renderHeroSkills();
    renderAboutSkills();
    
    // Atmospheric effects
    initUnderwater();
    initFlood();
    initContactRain();
    initDepthExperience();
    
    // Timeline scroll animation
    initTimelineAnimation();
    
    // Expose data for potential debugging
    if (typeof window !== 'undefined') {
        window.portfolioData = { projects, skills };
    }
});

/**
 * Render skills grid in hero section
 * Uses data-i18n keys for language switching
 */
function renderHeroSkills() {
    const arsenalGrid = document.querySelector('.arsenal_grid');
    if (!arsenalGrid) return;

    const lang = getCurrentLang();
    const texts = translations[lang];

    const fragment = document.createDocumentFragment();
    skills.forEach((skill, index) => {
        const div = document.createElement('div');
        div.className = 'skill_item';
        const skillKey = skill.i18n || `skill-${skill.name.toLowerCase().replace(/[\s&]+/g, '')}`;
        const displayName = texts[skillKey] || skill.name;
        div.innerHTML = `<i class='bx ${skill.icon}'></i><span>${displayName}</span>`;
        fragment.appendChild(div);
    });
    arsenalGrid.innerHTML = '';
    arsenalGrid.appendChild(fragment);
}

/**
 * Render skills grid in about section
 * Uses data-i18n keys for language switching
 */
function renderAboutSkills() {
    const skillsGrid = document.querySelector('.lexicon_section .skills_grid');
    if (!skillsGrid) return;

    const lang = getCurrentLang();
    const texts = translations[lang];

    const fragment = document.createDocumentFragment();
    skills.forEach((skill, index) => {
        const div = document.createElement('div');
        div.className = 'skill_item_box';
        // About skills use different i18n keys (about-skill-1 to 8)
        const aboutKey = `about-skill-${index + 1}`;
        const displayName = texts[aboutKey] || skill.name;
        div.innerHTML = `<i class='bx ${skill.icon}'></i><span>${displayName}</span>`;
        fragment.appendChild(div);
    });
    skillsGrid.innerHTML = '';
    skillsGrid.appendChild(fragment);
}

/**
 * Initialize timeline scroll-reveal animation
 */
function initTimelineAnimation() {
    const timelineItems = document.querySelectorAll('.timeline_item');
    if (timelineItems.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            entry.target.classList.toggle('show', entry.isIntersecting);
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    timelineItems.forEach(item => {
        observer.observe(item);
    });
}
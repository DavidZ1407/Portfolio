/* ========================================= */
/* MAIN ENTRY POINT */
/* ========================================= */

import { initNavigation } from './modules/navigation.js';
import { initCarousel } from './modules/hero_carousel.js';
import { generateCarouselDots } from './modules/carousel_dots.js';
import { initParallax, updateParallaxHeight } from './modules/parallax.js';
import { initModal, showPopupAtCard } from './modules/modal.js';
import { initPortal } from './modules/portal.js';
import { initUnderwater } from './modules/underwater.js';
import { initFlood } from './modules/flood.js';
import { initContactRain } from './modules/particle_rain.js';
import { initDepthExperience } from './modules/depth_experience.js';
import { initFishSwarm } from './modules/fish_swarm.js';
import { initBioluminescentSwarm } from './modules/bioluminescent_swarm.js';
import { initHeroShader } from './modules/ocean_shader.js';
import { initWaterLogo } from './modules/water_logo.js';
import { initWaterSubtitle } from './modules/water_subtitle.js';
import { initLanguage, getCurrentLang } from './modules/language.js';
import { projects } from './constants/projects.js?v=6';
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
    
    // Hero Three.js Shader Parallax
    initHeroShader();
    
    // Water Logo Shader Effect
    initWaterLogo();
    
    // Water Subtitle Cycling Shader Effect
    initWaterSubtitle();
    
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
    
    // Fish swarm transition (scroll-triggered, all sections)
    initFishSwarm();
    
    // Bioluminescent creature shadows (persistent, timeline section)
    initBioluminescentSwarm();

    // Timeline scroll animation
    initTimelineAnimation();
    
    // Data accessible via module imports
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
        div.setAttribute('data-skill', skill.name);
        const skillKey = skill.i18n || `skill-${skill.name.toLowerCase().replace(/[\s&]+/g, '')}`;
        const displayName = texts[skillKey] || skill.name;
        div.innerHTML = `<i class='bx ${skill.icon}'></i><span>${displayName}</span>`;
        fragment.appendChild(div);
    });
    arsenalGrid.innerHTML = '';
    arsenalGrid.appendChild(fragment);
    
    // Highlight skills for initial project
    setTimeout(() => {
        const activeSlide = document.querySelector('.carousel_indicators .indicator.active');
        if (activeSlide) {
            const initialIndex = parseInt(activeSlide.getAttribute('data-slide'));
            if (window.highlightHeroSkills) {
                window.highlightHeroSkills(initialIndex);
            }
        }
    }, 200);
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
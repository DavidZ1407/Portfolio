/**
 * File: main.js
 * Description: Application entry point: imports all constants and modules, then initializes every site animation and interaction.
 */
import { initNavigation } from './modules/navigation.js';
import { initCarousel } from './modules/hero_carousel.js';
import { generateCarouselDots } from './modules/carousel_dots.js';
import { initParallax, updateParallaxHeight } from './modules/parallax.js';
import { initModal, showPopupAtCard } from './modules/modal.js';
import { initSkillProjectLink } from './modules/skill_link.js';
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
import { projects } from './constants/projects.js?v=10';
import { skills, skillIconHtml } from './constants/skills.js?v=4';
import { translations } from './constants/translations.js?v=2';

// One broken visual effect must never take down the rest of the page:
// containing init errors keeps navigation, i18n, carousel and modal working
// even if an optional effect (e.g. unsupported WebGL) throws during setup.
function safeInit(label, init) {
    try {
        init();
    } catch (err) {
        console.error(`[init] "${label}" failed - module skipped:`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Language must be first (sets up data-i18n). Intentionally unguarded:
    // a failure here is fundamental (no translated text at all) and must
    // stay visible instead of being silently contained.
    initLanguage();

    // Generate carousel dots BEFORE initializing carousels
    safeInit('carousel-dots', generateCarouselDots);

    // Core navigation & layout
    safeInit('navigation', initNavigation);
    safeInit('hero-carousel', initCarousel);
    safeInit('parallax', initParallax);
    safeInit('parallax-height', updateParallaxHeight);

    // Hero Three.js shader parallax (optional WebGL effect)
    safeInit('ocean-shader', initHeroShader);

    // Water logo / subtitle shader effects (optional WebGL effects)
    safeInit('water-logo', initWaterLogo);
    safeInit('water-subtitle', initWaterSubtitle);

    // Modal & Portal carousel
    safeInit('modal', () => initModal(projects));
    safeInit('portal', () => initPortal((card) => {
        const projectIndex = parseInt(card.dataset.project);
        if (projectIndex >= 0 && projectIndex < projects.length) {
            showPopupAtCard(projects[projectIndex], card);
        }
    }));

    // Dynamic content rendering (language-aware)
    safeInit('hero-skills', renderHeroSkills);
    safeInit('about-skills', renderAboutSkills);

    // Skill <-> project link:
    // Hovering a skill card in the hero arsenal highlights all project cards
    // (hero carousel + 3D portal) that use this skill.
    safeInit('skill-link', initSkillProjectLink);

    // Atmospheric effects
    safeInit('underwater', initUnderwater);
    safeInit('flood', initFlood);
    safeInit('contact-rain', initContactRain);
    safeInit('depth-experience', initDepthExperience);

    // Fish swarm transition (scroll-triggered, all sections)
    safeInit('fish-swarm', initFishSwarm);

    // Bioluminescent creature shadows (persistent, timeline section)
    safeInit('bio-swarm', initBioluminescentSwarm);

    // Timeline scroll animation
    safeInit('timeline', initTimelineAnimation);

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
    skills.forEach((skill) => {
        const div = document.createElement('div');
        div.className = 'skill_item';
        // data-skill = skill registry id (link to the projects,
        // see skill_link.js + projects.js -> skills: [...])
        div.setAttribute('data-skill', skill.id);
        const skillKey = skill.i18n || `skill-${skill.name.toLowerCase().replace(/[\s&]+/g, '')}`;
        const displayName = texts[skillKey] || skill.name;
        div.innerHTML = `${skillIconHtml(skill)}<span>${displayName}</span>`;
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

// Render the skills grid in the about section
function renderAboutSkills() {
    const skillsGrid = document.querySelector('.lexicon_section .skills_grid');
    if (!skillsGrid) return;

    const lang = getCurrentLang();
    const texts = translations[lang];

    const fragment = document.createDocumentFragment();
    skills.forEach((skill) => {
        const div = document.createElement('div');
        div.className = 'skill_item_box';
        const skillKey = skill.i18n || `skill-${skill.name.toLowerCase().replace(/[\s&]+/g, '')}`;
        const displayName = texts[skillKey] || skill.name;
        div.innerHTML = `${skillIconHtml(skill)}<span>${displayName}</span>`;
        fragment.appendChild(div);
    });
    skillsGrid.innerHTML = '';
    skillsGrid.appendChild(fragment);
}

// Initialize the timeline scroll-reveal animation
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
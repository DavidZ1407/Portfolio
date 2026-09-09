/* ==========================================================================
   FILE: js/main.js
   DESCRIPTION: Application entry point that imports all constants and modules and initializes every site animation and interaction.
   ========================================================================== */

import { initNavigation } from './modules/navigation.js';
import { initCarousel } from './modules/hero_carousel.js';
import { generateCarouselDots } from './modules/carousel_dots.js';
import { initParallax, updateParallaxHeight } from './modules/parallax.js';
import { initModal, showPopupAtCard } from './modules/modal.js?v=18';
import { initSkillProjectLink } from './modules/skill_link.js';
import { initPortal } from './modules/portal.js?v=13';
import { initUnderwater } from './modules/underwater.js';
import { initFlood } from './modules/flood.js';
import { initContactRain } from './modules/particle_rain.js';
import { initDepthExperience } from './modules/depth_experience.js?v=2';
import { initFishSwarm } from './modules/fish_swarm.js';
import { initBioluminescentSwarm } from './modules/bioluminescent_swarm.js';
import { initHeroShader } from './modules/ocean_shader.js?v=3';
import { initWaterLogo } from './modules/water_logo.js?v=3';
import { initWaterSubtitle } from './modules/water_subtitle.js?v=4';
import { initLanguage, getCurrentLang } from './modules/language.js?v=1';
import { projects } from './constants/projects.js?v=11';
import { skills, skillIconHtml } from './constants/skills.js?v=4';
import { translations } from './constants/translations.js?v=2';




function safeInit(label, init) {
    try {
        init();
    } catch (err) {
        console.error(`[init] "${label}" failed - module skipped:`, err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    
    
    
    initLanguage();

    
    safeInit('carousel-dots', generateCarouselDots);

    
    safeInit('navigation', initNavigation);
    safeInit('hero-carousel', initCarousel);
    safeInit('parallax', initParallax);
    safeInit('parallax-height', updateParallaxHeight);

    
    safeInit('ocean-shader', initHeroShader);

    
    safeInit('water-logo', initWaterLogo);
    safeInit('water-subtitle', initWaterSubtitle);

    
    safeInit('modal', () => initModal(projects));
    safeInit('portal', () => initPortal((card) => {
        const projectIndex = parseInt(card.dataset.project);
        if (projectIndex >= 0 && projectIndex < projects.length) {
            showPopupAtCard(projects[projectIndex], card);
        }
    }));

    
    safeInit('hero-skills', renderHeroSkills);
    safeInit('about-skills', renderAboutSkills);

    
    
    
    safeInit('skill-link', initSkillProjectLink);

    
    safeInit('underwater', initUnderwater);
    safeInit('flood', initFlood);
    safeInit('contact-rain', initContactRain);
    safeInit('depth-experience', initDepthExperience);

    
    safeInit('fish-swarm', initFishSwarm);

    
    safeInit('bio-swarm', initBioluminescentSwarm);

    
    safeInit('timeline', initTimelineAnimation);

});


function renderHeroSkills() {
    const arsenalGrid = document.querySelector('.arsenal_grid');
    if (!arsenalGrid) return;

    const lang = getCurrentLang();
    const texts = translations[lang];

    const fragment = document.createDocumentFragment();
    skills.forEach((skill) => {
        const div = document.createElement('div');
        div.className = 'skill_item';
        
        
        div.setAttribute('data-skill', skill.id);
        const skillKey = skill.i18n || `skill-${skill.name.toLowerCase().replace(/[\s&]+/g, '')}`;
        const displayName = texts[skillKey] || skill.name;
        div.innerHTML = `${skillIconHtml(skill)}<span>${displayName}</span>`;
        fragment.appendChild(div);
    });
    arsenalGrid.innerHTML = '';
    arsenalGrid.appendChild(fragment);

    
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
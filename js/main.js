/* ========================================= */
/* MAIN ENTRY POINT */
/* ========================================= */

import { initNavigation } from './modules/navigation.js';
import { initCarousel } from './modules/carousel.js';
import { initParallax, updateParallaxHeight } from './modules/parallax.js';
import { initModal, showPopupAtCard } from './modules/modal.js';
import { initPortal } from './modules/portal.js';
import { initUnderwater } from './modules/underwater.js';
import { initFlood } from './modules/flood.js';
import { initContactRain } from './modules/contact-rain.js';
import { initDepthExperience } from './modules/depth-experience.js';
import { projects } from './constants/projects.js';
import { skills } from './constants/skills.js';
import { timelineData } from './constants/timeline.js';

document.addEventListener('DOMContentLoaded', () => {
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
    
    // Dynamic content rendering
    renderHeroSkills();
    
    // Atmospheric effects
    initUnderwater();
    initFlood();
    initContactRain();
    initDepthExperience();
    
    // Timeline scroll animation
    initTimelineAnimation();
    
    // Expose data for potential debugging
    if (typeof window !== 'undefined') {
        window.portfolioData = { projects, skills, timelineData };
    }
});

/**
 * Render skills grid in hero section
 * Uses DocumentFragment for batch DOM insertion
 */
function renderHeroSkills() {
    const arsenalGrid = document.querySelector('.arsenal_grid');
    if (!arsenalGrid) return;
    
    const fragment = document.createDocumentFragment();
    skills.forEach(skill => {
        const div = document.createElement('div');
        div.className = 'skill_item';
        div.innerHTML = `<i class='bx ${skill.icon}'></i><span>${skill.name}</span>`;
        fragment.appendChild(div);
    });
    arsenalGrid.innerHTML = '';
    arsenalGrid.appendChild(fragment);
}

/**
 * Initialize timeline scroll-reveal animation
 * Uses IntersectionObserver for efficient scroll detection
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
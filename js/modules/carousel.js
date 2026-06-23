/* ========================================= */
/* MODULE - CAROUSEL */
/* ========================================= */

import { cleanupRegistry } from '../utils/helpers.js';

let currentProjectIndex = 0;
let cleanupFunctions = [];
let autoPlayInterval = null;
const AUTO_PLAY_DELAY = 5000; // 5 seconds per slide

/**
 * Initialize the hero carousel
 */
export function initCarousel() {
    const indicators = document.querySelectorAll('.indicator');
    
    // Apply ARIA labels to indicators
    indicators.forEach((indicator, i) => {
        indicator.setAttribute('aria-label', `Go to project ${i + 1}`);
        
        const onClick = () => {
            const slideIndex = parseInt(indicator.getAttribute('data-slide'));
            goToSlide(slideIndex);
            resetAutoPlay();
        };
        indicator.addEventListener('click', onClick);
        cleanupFunctions.push(() => indicator.removeEventListener('click', onClick));
    });

    // Start auto-play
    startAutoPlay();

    // Register cleanup
    cleanupRegistry.register(() => {
        cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupFunctions = [];
        stopAutoPlay();
    });
}

function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
        const totalSlides = document.querySelectorAll('.carousel_slide').length;
        if (totalSlides > 0) {
            const nextIndex = (currentProjectIndex + 1) % totalSlides;
            goToSlide(nextIndex);
        }
    }, AUTO_PLAY_DELAY);
}

function stopAutoPlay() {
    if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
        autoPlayInterval = null;
    }
}

function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
}

function goToSlide(index) {
    const track = document.querySelector('.carousel_track');
    const indicators = document.querySelectorAll('.indicator');
    
    if (!track) return;
    
    currentProjectIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
        if (i === index) {
            indicator.setAttribute('aria-current', 'true');
        } else {
            indicator.removeAttribute('aria-current');
        }
    });
    
    // Highlight matching skills in hero arsenal based on current project
    highlightHeroSkills(index);
}

export function highlightHeroSkills(projectIndex) {
    // Import projects dynamically to get skills for current project
    import('../constants/projects.js').then(({ projects }) => {
        const project = projects[projectIndex];
        if (!project || !project.skills) return;
        
        const skillItems = document.querySelectorAll('.arsenal_grid .skill_item');
        const skillNames = project.skills.map(s => s.name.toLowerCase());
        
        skillItems.forEach(item => {
            const skillName = item.getAttribute('data-skill') || '';
            const isMatch = skillNames.includes(skillName.toLowerCase());
            item.classList.toggle('skill-active', isMatch);
        });
    }).catch(() => {});
}

/**
 * Go to next slide
 */
export function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel_slide').length;
    goToSlide((currentProjectIndex + 1) % totalSlides);
}

/**
 * Go to previous slide
 */
export function prevSlide() {
    const totalSlides = document.querySelectorAll('.carousel_slide').length;
    goToSlide((currentProjectIndex - 1 + totalSlides) % totalSlides);
}
/* ========================================= */
/* MODULE - CAROUSEL */
/* ========================================= */

import { cleanupRegistry } from '../utils/helpers.js';

let currentProjectIndex = 0;
let cleanupFunctions = [];

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
        };
        indicator.addEventListener('click', onClick);
        cleanupFunctions.push(() => indicator.removeEventListener('click', onClick));
    });

    // Register cleanup
    cleanupRegistry.register(() => {
        cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupFunctions = [];
    });
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
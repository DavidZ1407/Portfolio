/* ========================================= */
/* MODULE - GENERATE CAROUSEL DOTS */
/* Automatically generates indicator dots based on projects.length */
/* ========================================= */

import { getOrderedProjectIndices } from '../constants/projects.js?v=5';

export function generateCarouselDots() {
    // Anzahl = eine Karte je Kategorie (gleiche Reihenfolge wie Portal/Hero)
    const projectCount = getOrderedProjectIndices().length;

    // Generate Hero Carousel Indicators
    generateHeroIndicators(projectCount);

    // Generate Portal Carousel Dots
    generatePortalDots(projectCount);
}

function generateHeroIndicators(count) {
    const indicatorsContainer = document.querySelector('.carousel_indicators');
    
    if (!indicatorsContainer) return;

    // Clear existing indicators
    indicatorsContainer.innerHTML = '';

    // Generate new indicators with ARIA labels
    for (let i = 0; i < count; i++) {
        const button = document.createElement('button');
        button.className = 'indicator';
        button.setAttribute('data-slide', i);
        button.setAttribute('aria-label', `Go to project ${i + 1}`);
        button.setAttribute('aria-current', i === 0 ? 'true' : 'false');
        if (i === 0) button.classList.add('active');
        indicatorsContainer.appendChild(button);
    }
}

function generatePortalDots(count) {
    const dotsContainer = document.querySelector('.carousel-dots');
    
    if (!dotsContainer) return;

    // Clear existing dots
    dotsContainer.innerHTML = '';

    // Generate new dots with ARIA labels
    for (let i = 0; i < count; i++) {
        const button = document.createElement('button');
        button.className = 'c-dot';
        button.setAttribute('data-slide', i);
        button.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === 0) button.classList.add('active');
        dotsContainer.appendChild(button);
    }
}


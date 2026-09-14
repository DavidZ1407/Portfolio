/* ==========================================================================
   FILE: js/modules/carousel_dots.js
   DESCRIPTION: Generates and manages the dot indicators for the hero and portal carousels.
   ========================================================================== */

import { getOrderedProjectIndices } from '../constants/projects.js?v=11';

export function generateCarouselDots() {

    const projectCount = getOrderedProjectIndices().length;


    generateHeroIndicators(projectCount);


    generatePortalDots(projectCount);
}

function generateHeroIndicators(count) {
    const indicatorsContainer = document.querySelector('.carousel_indicators');

    if (!indicatorsContainer) return;

    indicatorsContainer.innerHTML = '';

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

    dotsContainer.innerHTML = '';

    for (let i = 0; i < count; i++) {
        const button = document.createElement('button');
        button.className = 'c-dot';
        button.setAttribute('data-slide', i);
        button.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === 0) button.classList.add('active');
        dotsContainer.appendChild(button);
    }
}


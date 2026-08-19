/* ========================================= */
/* MODULE - CAROUSEL */
/* ========================================= */

import { projects, getProjectSubtitle, getProjectCover, applyImageFallback } from "../constants/projects.js?v=5";
import { getCurrentLang } from "./language.js";
import { cleanupRegistry } from '../utils/helpers.js';

let currentProjectIndex = 0;
let cleanupFunctions = [];
let autoPlayInterval = null;
const AUTO_PLAY_DELAY = 5000; // 5 seconds per slide

/**
 * Build carousel slides dynamically from projects.js
 * (eine Kategorie = ein Portal-Slide)
 */
function buildCarouselSlides() {
    const track = document.querySelector('.carousel_track');
    if (!track) return;
    track.innerHTML = '';
    const lang = getCurrentLang();

    projects.forEach((project, i) => {
        const slide = document.createElement('div');
        slide.className = 'carousel_slide';
        slide.setAttribute('data-index', i);

        const img = document.createElement('img');
        img.src = getProjectCover(i) || '';
        img.alt = project.title || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        // Fallback fuer fehlendes Cover
        applyImageFallback(img, project.category);
        slide.appendChild(img);

        const info = document.createElement('div');
        info.className = 'carousel_info';
        const h4 = document.createElement('h4');
        h4.textContent = project.title;
        const p = document.createElement('p');
        p.textContent = getProjectSubtitle(i, lang);
        info.appendChild(h4);
        info.appendChild(p);
        slide.appendChild(info);

        track.appendChild(slide);
    });
}

/**
 * Update Titel/Untertitel der Hero-Slides (bei Sprachwechsel)
 */
function renderCarouselLabels() {
    const lang = getCurrentLang();
    document.querySelectorAll('.carousel_track .carousel_slide').forEach((slide, i) => {
        const project = projects[i];
        if (!project) return;
        const h4 = slide.querySelector('.carousel_info h4');
        const p = slide.querySelector('.carousel_info p');
        if (h4) h4.textContent = project.title;
        if (p) p.textContent = getProjectSubtitle(i, lang);
    });
}

/**
 * Initialize the hero carousel
 */
export function initCarousel() {
    // Slides dynamisch aus projects.js erzeugen
    buildCarouselSlides();

    const indicators = document.querySelectorAll('.indicator');
    const slides = document.querySelectorAll('.carousel_slide');

    // Labels bei Sprachwechsel aktualisieren
    const onLangChanged = renderCarouselLabels;
    document.addEventListener('languageChanged', onLangChanged);
    
    // Apply ARIA labels to indicators
    indicators.forEach((indicator, i) => {
        indicator.setAttribute('aria-label', `Go to project ${i + 1}`);
        
        const onClick = () => {
            const slideIndex = parseInt(indicator.getAttribute('data-slide'));
            goToSlide(slideIndex);
            resetAutoPlay();
            navigateToWorkSection(slideIndex);
        };
        indicator.addEventListener('click', onClick);
        cleanupFunctions.push(() => indicator.removeEventListener('click', onClick));
    });

    // Make carousel slides clickable -> navigate to #work section
    slides.forEach((slide, i) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.style.cursor = 'pointer';

        const onSlideClick = (e) => {
            e.preventDefault();
            goToSlide(i);
            resetAutoPlay();
            navigateToWorkSection(i);
        };
        slide.addEventListener('click', onSlideClick);
        cleanupFunctions.push(() => slide.removeEventListener('click', onSlideClick));
    });

    // Start auto-play
    startAutoPlay();

    // Register cleanup
    cleanupRegistry.register(() => {
        cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupFunctions = [];
        stopAutoPlay();
        document.removeEventListener('languageChanged', onLangChanged);
    });
}

/**
 * Navigate to the #work section and show the clicked project in the portal carousel
 * @param {number} slideIndex - The project index to show
 */
function navigateToWorkSection(slideIndex) {
    const workSection = document.querySelector('#work');
    if (!workSection) return;

    // Smooth scroll to the work section
    workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Dynamically import the portal module and navigate to the selected slide
    if (window.goToPortalSlide) {
        window.goToPortalSlide(slideIndex);
    }
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
    // Highlight skills for current project using static projects import

        const project = projects[projectIndex];
        if (!project) return;
        const projectTools = project.tools || project.skills || [];
        
        const skillItems = document.querySelectorAll('.arsenal_grid .skill_item');
        const toolNames = projectTools.map(s => (s.name || s).toLowerCase());
        
        skillItems.forEach(item => {
            const skillName = item.getAttribute('data-skill') || '';
            const isMatch = toolNames.includes(skillName.toLowerCase());
            item.classList.toggle('skill-active', isMatch);
        });
    }
window.highlightHeroSkills = highlightHeroSkills;

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

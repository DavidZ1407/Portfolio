/**
 * File: hero_carousel.js
 * Description: Hero works carousel: slide rendering from project data, autoplay, and navigation controls.
 */
import { projects, getProjectSubtitle, getProjectCover, getProjectTitle, getProjectSkillIds, getOrderedProjectIndices, applyImageFallback } from "../constants/projects.js?v=9";
import { getCurrentLang } from "./language.js";
import { cleanupRegistry, bindHorizontalSwipe } from '../utils/helpers.js';

let currentProjectIndex = 0;
let cleanupFunctions = [];
let autoPlayInterval = null;
const AUTO_PLAY_DELAY = 5000; // 5 seconds per slide

/**
 * Build carousel slides dynamically from projects.js
 * (one category = one portal slide, same order as the portal)
 */
function buildCarouselSlides() {
    const track = document.querySelector('.carousel_track');
    if (!track) return;
    track.innerHTML = '';
    const lang = getCurrentLang();

    const orderedProjectIndices = getOrderedProjectIndices();

    orderedProjectIndices.forEach((projectIdx, slideIndex) => {
        const project = projects[projectIdx];
        if (!project) return;

        const slide = document.createElement('div');
        slide.className = 'carousel_slide';
        // data-index = position in the carousel; data-project = index in projects[]
        slide.setAttribute('data-index', slideIndex);
        slide.setAttribute('data-project', projectIdx);

        const img = document.createElement('img');
        img.src = getProjectCover(projectIdx) || '';
        img.alt = getProjectTitle(projectIdx, lang) || '';
        // The first slide sits inside the initial viewport (hero) and is the
        // closest thing to an LCP image on this page - load it eagerly.
        // Every other slide is a candidate for lazy loading.
        img.loading = slideIndex === 0 ? 'eager' : 'lazy';
        img.decoding = 'async';
        // Optional: show the cover completely (coverFit: 'contain'), no crop
        if (project.coverFit === 'contain') img.classList.add('fit-contain');
        // Fallback for a missing cover
        applyImageFallback(img, project.category);
        slide.appendChild(img);

        const info = document.createElement('div');
        info.className = 'carousel_info';
        const h4 = document.createElement('h4');
        h4.textContent = getProjectTitle(projectIdx, lang);
        const p = document.createElement('p');
        p.textContent = getProjectSubtitle(projectIdx, lang);
        info.appendChild(h4);
        info.appendChild(p);
        slide.appendChild(info);

        track.appendChild(slide);
    });
}

/**
 * Update titles/subtitles of the hero slides (on language change)
 */
function renderCarouselLabels() {
    const lang = getCurrentLang();
    document.querySelectorAll('.carousel_track .carousel_slide').forEach((slide) => {
        const projectIdx = parseInt(slide.dataset.project);
        const project = projects[projectIdx];
        if (!project) return;
        const h4 = slide.querySelector('.carousel_info h4');
        const p = slide.querySelector('.carousel_info p');
        if (h4) h4.textContent = getProjectTitle(projectIdx, lang);
        if (p) p.textContent = getProjectSubtitle(projectIdx, lang);
    });
}

/**
 * Initialize the hero carousel
 */
export function initCarousel() {
    // Build slides dynamically from projects.js
    buildCarouselSlides();

    const indicators = document.querySelectorAll('.indicator');
    const slides = document.querySelectorAll('.carousel_slide');

    // Update labels on language change
    const onLangChanged = renderCarouselLabels;
    document.addEventListener('languageChanged', onLangChanged);

    // Touch swipe: left goes to the next card, right to the previous one
    const track = document.querySelector('.carousel_track');
    if (track) {
        const cleanupSwipe = bindHorizontalSwipe(
            track,
            () => { goToSlide((currentProjectIndex + 1) % slides.length); resetAutoPlay(); },
            () => { goToSlide((currentProjectIndex - 1 + slides.length) % slides.length); resetAutoPlay(); }
        );
        cleanupFunctions.push(cleanupSwipe);
    }
    
    // Apply ARIA labels to indicators
    indicators.forEach((indicator, i) => {
        indicator.setAttribute('aria-label', `Go to project ${i + 1}`);
        
        const onClick = () => {
            const slideIndex = parseInt(indicator.getAttribute('data-slide'));
            goToSlide(slideIndex);
            resetAutoPlay();
            const slide = document.querySelectorAll('.carousel_slide')[slideIndex];
            const projectIdx = slide ? parseInt(slide.dataset.project) : slideIndex;
            navigateToWorkSection(projectIdx);
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
            const projectIdx = parseInt(slide.dataset.project);
            navigateToWorkSection(projectIdx);
        };
        slide.addEventListener('click', onSlideClick);
        cleanupFunctions.push(() => slide.removeEventListener('click', onSlideClick));
    });

    // Start auto-play
    startAutoPlay();

    // Pause auto-play whenever the hero section leaves the viewport.
    // The slide transform itself is cheap, but skipping a timer-driven
    // animation for an off-screen carousel is a free win on mobile.
    const heroSection = document.querySelector('.hero_section');
    if (heroSection && 'IntersectionObserver' in window) {
        const heroObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) startAutoPlay();
            else stopAutoPlay();
        }, { threshold: 0.05 });
        heroObserver.observe(heroSection);
        cleanupFunctions.push(() => heroObserver.disconnect());
    }

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
 * @param {number} projectIndex - The project index (in projects[]) to show
 */
function navigateToWorkSection(projectIndex) {
    const workSection = document.querySelector('#work');
    if (!workSection) return;

    // Smooth scroll to the work section
    workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Dynamically import the portal module and navigate to the selected project
    if (window.goToPortalSlide) {
        window.goToPortalSlide(projectIndex);
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
    const slides = document.querySelectorAll('.carousel_slide');
    
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
    
    // Highlight matching skills in hero arsenal based on the slide's project
    const projectIdx = slides[index] ? parseInt(slides[index].dataset.project) : index;
    highlightHeroSkills(projectIdx);
}

export function highlightHeroSkills(projectIndex) {
    // Highlights the arsenal skills used by the currently shown project.
    // Compares skill registry ids (skills.js) with the items' data-skill.
    const projectSkillIds = getProjectSkillIds(projectIndex);

    const skillItems = document.querySelectorAll('.arsenal_grid .skill_item');

    skillItems.forEach(item => {
        const skillId = item.getAttribute('data-skill') || '';
        const isMatch = projectSkillIds.includes(skillId);
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

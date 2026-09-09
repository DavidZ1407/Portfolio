/* ==========================================================================
   FILE: js/modules/hero_carousel.js
   DESCRIPTION: Hero works carousel: slide rendering from project data, autoplay, and navigation controls.
   ========================================================================== */

import { projects, getProjectSubtitle, getProjectCover, getProjectTitle, getProjectSkillIds, getOrderedProjectIndices, applyImageFallback } from "../constants/projects.js?v=11";
import { getCurrentLang } from "./language.js";
import { cleanupRegistry, bindHorizontalSwipe } from '../utils/helpers.js';

let currentProjectIndex = 0;
let cleanupFunctions = [];
let autoPlayInterval = null;
const AUTO_PLAY_DELAY = 5000; 


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
        
        slide.setAttribute('data-index', slideIndex);
        slide.setAttribute('data-project', projectIdx);

        const img = document.createElement('img');
        img.src = getProjectCover(projectIdx) || '';
        img.alt = getProjectTitle(projectIdx, lang) || '';
        
        
        
        img.loading = slideIndex === 0 ? 'eager' : 'lazy';
        
        if (slideIndex === 0) img.fetchPriority = 'high';
        img.decoding = 'async';
        
        if (project.coverFit === 'contain') img.classList.add('fit-contain');
        
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


export function initCarousel() {
    
    buildCarouselSlides();

    const indicators = document.querySelectorAll('.indicator');
    const slides = document.querySelectorAll('.carousel_slide');

    
    const onLangChanged = renderCarouselLabels;
    document.addEventListener('languageChanged', onLangChanged);

    
    const track = document.querySelector('.carousel_track');
    if (track) {
        const cleanupSwipe = bindHorizontalSwipe(
            track,
            () => { goToSlide((currentProjectIndex + 1) % slides.length); resetAutoPlay(); },
            () => { goToSlide((currentProjectIndex - 1 + slides.length) % slides.length); resetAutoPlay(); }
        );
        cleanupFunctions.push(cleanupSwipe);
    }
    
    
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

    
    startAutoPlay();

    
    
    
    const heroSection = document.querySelector('.hero_section');
    if (heroSection && 'IntersectionObserver' in window) {
        const heroObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) startAutoPlay();
            else stopAutoPlay();
        }, { threshold: 0.05 });
        heroObserver.observe(heroSection);
        cleanupFunctions.push(() => heroObserver.disconnect());
    }

    
    cleanupRegistry.register(() => {
        cleanupFunctions.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupFunctions = [];
        stopAutoPlay();
        document.removeEventListener('languageChanged', onLangChanged);
    });
}


function navigateToWorkSection(projectIndex) {
    const workSection = document.querySelector('#work');
    if (!workSection) return;

    workSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    
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
    
    
    const projectIdx = slides[index] ? parseInt(slides[index].dataset.project) : index;
    highlightHeroSkills(projectIdx);
}

export function highlightHeroSkills(projectIndex) {
    
    
    const projectSkillIds = getProjectSkillIds(projectIndex);

    const skillItems = document.querySelectorAll('.arsenal_grid .skill_item');

    skillItems.forEach(item => {
        const skillId = item.getAttribute('data-skill') || '';
        const isMatch = projectSkillIds.includes(skillId);
        item.classList.toggle('skill-active', isMatch);
    });
}
window.highlightHeroSkills = highlightHeroSkills;


export function nextSlide() {
    const totalSlides = document.querySelectorAll('.carousel_slide').length;
    goToSlide((currentProjectIndex + 1) % totalSlides);
}


export function prevSlide() {
    const totalSlides = document.querySelectorAll('.carousel_slide').length;
    goToSlide((currentProjectIndex - 1 + totalSlides) % totalSlides);
}

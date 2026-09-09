/* ==========================================================================
   FILE: js/modules/navigation.js
   DESCRIPTION: Navbar behavior: scrollspy section highlighting, active link updates, and modal-aware anchor scrolling.
   ========================================================================== */

import { closeProjectModal, isProjectModalOpen } from './modal.js';


export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav_link');
    const sections = document.querySelectorAll('main[id], section[id]');
    
    if (navLinks.length === 0 || sections.length === 0) return;

    
    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav_link, .logo');
        if (!link) return;
        if (isProjectModalOpen()) {
            closeProjectModal({ immediate: true });
        }
    });

    
    const SCROLL_ACTIVE_OFFSET = 200;
    
    const BOTTOM_DETECT_OFFSET = 100;

    let ticking = false;
    
    
    let sectionRects = [];
    
    function cacheSectionRects() {
        sectionRects = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.getBoundingClientRect().top + window.pageYOffset - SCROLL_ACTIVE_OFFSET,
            height: section.offsetHeight
        }));
    }
    
    
    cacheSectionRects();
    window.addEventListener('resize', cacheSectionRects, { passive: true });

    function updateActiveLink() {
        let current = '';
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        
        for (let i = 0; i < sectionRects.length; i++) {
            const rect = sectionRects[i];
            if (scrollY >= rect.top && scrollY < rect.top + rect.height) {
                current = rect.id;
                break;
            }
        }

        
        if (!current && scrollY + windowHeight >= docHeight - BOTTOM_DETECT_OFFSET) {
            const lastSection = sectionRects[sectionRects.length - 1];
            if (lastSection) {
                current = lastSection.id;
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        if (current) {
            const activeLink = document.querySelector(`.nav_link[href="#${current}"]`);
            if (activeLink) activeLink.classList.add('active');
        }
        
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateActiveLink);
            ticking = true;
        }
    }, { passive: true });
}
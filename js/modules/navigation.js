/* ========================================= */
/* MODULE - NAVIGATION */
/* ========================================= */

/**
 * Initialize navigation with throttled scroll handler
 */
export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav_link');
    const sections = document.querySelectorAll('section[id]');
    
    if (navLinks.length === 0 || sections.length === 0) return;

    /* Offset oberhalb einer Sektion (px), ab dem sie als "aktiv" gilt */
    const SCROLL_ACTIVE_OFFSET = 200;
    /* Abstand zum Seitenende (px), ab dem die letzte Sektion aktiviert wird */
    const BOTTOM_DETECT_OFFSET = 100;

    let ticking = false;
    
    // Cache section positions to avoid repeated layout reads
    let sectionRects = [];
    
    function cacheSectionRects() {
        sectionRects = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.getBoundingClientRect().top + window.pageYOffset - SCROLL_ACTIVE_OFFSET,
            height: section.offsetHeight
        }));
    }
    
    // Cache on load and resize
    cacheSectionRects();
    window.addEventListener('resize', cacheSectionRects, { passive: true });

    function updateActiveLink() {
        let current = '';
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // Use cached rects instead of reading offsetTop/clientHeight every frame
        for (let i = 0; i < sectionRects.length; i++) {
            const rect = sectionRects[i];
            if (scrollY >= rect.top && scrollY < rect.top + rect.height) {
                current = rect.id;
                break;
            }
        }

        // Special case: if we're near the bottom of the page, activate the last section
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
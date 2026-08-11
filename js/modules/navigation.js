/* ========================================= */
/* MODULE - NAVIGATION */
/* ========================================= */

/**
 * Initialize navigation with throttled scroll handler
 */
export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    if (navLinks.length === 0 || sections.length === 0) return;

    let ticking = false;
    
    // Cache section positions to avoid repeated layout reads
    let sectionRects = [];
    
    function cacheSectionRects() {
        sectionRects = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.getBoundingClientRect().top + window.pageYOffset - 200,
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
        if (!current && scrollY + windowHeight >= docHeight - 100) {
            const lastSection = sectionRects[sectionRects.length - 1];
            if (lastSection) {
                current = lastSection.id;
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        if (current) {
            const activeLink = document.querySelector(`.nav-link[href="#${current}"]`);
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
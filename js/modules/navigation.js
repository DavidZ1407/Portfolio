/* ==========================================================================
   FILE: js/modules/navigation.js
   DESCRIPTION: Navbar behavior: scrollspy section highlighting, active link updates, and modal-aware anchor scrolling.
   ========================================================================== */

import { closeProjectModal, isProjectModalOpen } from './modal.js?v=21';


export function initNavigation() {
    const navLinks = document.querySelectorAll('.nav_link');
    const sections = document.querySelectorAll('main[id], section[id]');

    if (navLinks.length === 0 || sections.length === 0) return;
    const navToggle = document.querySelector('.mobile_nav_toggle');
    const navOverlay = document.querySelector('.navbar');

    function setMobileNavOpen(open) {
        if (!navToggle) return;
        document.body.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

        if (!open && navOverlay) {
            const endHide = () => {
                navOverlay.style.transition = '';
                navOverlay.style.opacity = '';
                navOverlay.style.visibility = '';
                navOverlay.querySelectorAll('.nav_link').forEach((link) => {
                    link.style.transition = '';
                    link.style.opacity = '';
                    link.style.transform = '';
                });
            };
            navOverlay.style.transition = 'none';
            navOverlay.style.opacity = '0';
            navOverlay.style.visibility = 'hidden';
            navOverlay.querySelectorAll('.nav_link').forEach((link) => {
                link.style.transition = 'none';
                link.style.opacity = '0';
                link.style.transform = 'translateY(16px)';
            });
            requestAnimationFrame(endHide);
        }
    }

    if (navToggle && navOverlay) {
        navToggle.addEventListener('click', () => {
            setMobileNavOpen(!document.body.classList.contains('nav-open'));
        });
        navOverlay.addEventListener('click', (e) => {
            if (e.target === navOverlay || !e.target.closest('.nav_link')) {
                setMobileNavOpen(false);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
                setMobileNavOpen(false);
            }
        });

        const desktopQuery = window.matchMedia('(min-width: 769px)');
        const closeOnDesktop = (mq) => { if (mq.matches) setMobileNavOpen(false); };
        if (desktopQuery.addEventListener) {
            desktopQuery.addEventListener('change', closeOnDesktop);
        } else if (desktopQuery.addListener) {
            desktopQuery.addListener(closeOnDesktop);
        }

        let wasModalOpen = document.body.classList.contains('modal-open');
        if (typeof MutationObserver !== 'undefined') {
            const bodyObserver = new MutationObserver(() => {
                const isModalOpen = document.body.classList.contains('modal-open');
                if (isModalOpen && !wasModalOpen) setMobileNavOpen(false);
                wasModalOpen = isModalOpen;
            });
            bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        }
    }


    document.addEventListener('click', (e) => {
        const link = e.target.closest('.nav_link, .logo');
        if (!link) return;
        setMobileNavOpen(false);
        if (isProjectModalOpen()) {
            closeProjectModal({ immediate: true });
        }

        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
            const targetId = href.slice(1);
            const target = targetId ? document.getElementById(targetId) : null;
            if (target) {
                e.preventDefault();
                const header = document.querySelector('.header');
                const headerH = header ? header.offsetHeight : 70;
                const y = Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerH - 10);
                const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                window.scrollTo({ top: Math.min(y, maxY), behavior: 'smooth' });
                history.replaceState(null, '', href);
                setTimeout(cacheSectionRects, 600);
                return;
            }
        }
    });


    const SCROLL_ACTIVE_OFFSET = 200;

    const BOTTOM_DETECT_OFFSET = 100;

    function activeOffset() {
        return window.innerWidth <= 768 ? 120 : SCROLL_ACTIVE_OFFSET;
    }

    let ticking = false;


    let sectionRects = [];

    function cacheSectionRects() {
        sectionRects = Array.from(sections).map(section => ({
            id: section.getAttribute('id'),
            top: section.getBoundingClientRect().top + window.pageYOffset - activeOffset(),
            height: section.offsetHeight
        }));
    }


    cacheSectionRects();
    window.addEventListener('resize', cacheSectionRects, { passive: true });
    window.addEventListener('load', cacheSectionRects);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(cacheSectionRects).catch(() => { }) }

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

        if (scrollY + windowHeight >= docHeight - BOTTOM_DETECT_OFFSET) {
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
    updateActiveLink();
}
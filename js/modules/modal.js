/* ========================================= */
/* PROJECT MODAL MODULE - SIMPLE POPUP */
/* With SVG water-distort emerge animation   */
/* ========================================= */

import { getCurrentLang } from './language.js';
import { getProjectFullDescription, getProjectDescription } from '../constants/projects.js';
import { initModalShader } from './modal-shader.js';

/**
 * Modal with SVG filter water emergence (like hover effect)
 */

let modalOverlay = null;
let modalContainer = null;
let modalShader = null;
let currentProject = null;
let projectsList = [];
let currentProjectIndex = 0;

/**
 * Initialize modal system
 */
export function initModal(projects) {
    createModalElements();
    attachEventListeners(projects);
}

/**
 * Create modal HTML elements
 */
function createModalElements() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'project-modal-overlay';
    
    modalContainer = document.createElement('div');
    modalContainer.className = 'project-modal';
    
    modalContainer.innerHTML = `
        <button class="modal-close-btn" aria-label="Close">✕</button>
        <button class="modal-prev-btn" aria-label="Previous project">‹</button>
        <button class="modal-next-btn" aria-label="Next project">›</button>
        
        <div class="modal-content">
            <div class="modal-project-header">
                <h2 class="modal-project-title"></h2>
                <p class="modal-project-subtitle"></p>
            </div>
            
            <img class="modal-project-image" src="" alt="">
            
            <p class="modal-project-description"></p>
            
            <div class="modal-skills-section">
                <h3 class="modal-skills-title">Tools & Skills Used</h3>
                <div class="modal-skills-grid"></div>
            </div>
        </div>
    `;
    
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Initialize voronoi shader background
    modalShader = initModalShader(modalContainer);
}

/**
 * Attach event listeners
 */
function attachEventListeners(projects) {
    projectsList = projects;
    
    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => closePopup());
    
    const prevBtn = modalContainer.querySelector('.modal-prev-btn');
    const nextBtn = modalContainer.querySelector('.modal-next-btn');
    prevBtn.addEventListener('click', () => navigateProject(-1));
    nextBtn.addEventListener('click', () => navigateProject(1));
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowLeft') navigateProject(-1);
        if (e.key === 'ArrowRight') navigateProject(1);
    });
    
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePopup();
    });
}

/**
 * Navigate to previous/next project with water effect
 */
function navigateProject(direction) {
    if (!projectsList.length) return;
    currentProjectIndex = (currentProjectIndex + direction + projectsList.length) % projectsList.length;
    const project = projectsList[currentProjectIndex];
    currentProject = project;
    
    // Trigger water effect on navigation
    modalContainer.classList.remove('water-emerge', 'fade-complete');
    void modalContainer.offsetWidth;
    
    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
    }
    modalContainer._emergeTimer = setTimeout(() => {
        // Remove water-emerge class - SVG filter already at scale=0
        modalContainer.classList.remove('water-emerge');
    }, 1000); // after SVG animation completes (0.8s + buffer)
    
    // Restart SVG animation
    const svgFilter = document.getElementById('water-emerge');
    if (svgFilter) {
        const animations = svgFilter.querySelectorAll('animate');
        animations.forEach(anim => {
            try {
                anim.beginElement();
            } catch (e) {
                const parent = svgFilter.parentNode;
                const clone = svgFilter.cloneNode(true);
                parent.replaceChild(clone, svgFilter);
            }
        });
    }
    
    // Update shader color scheme for new project
    if (modalShader) {
        modalShader.setColorScheme(currentProjectIndex);
    }
    
    modalContainer.classList.add('water-emerge');
    populateModal(project);
}

/**
 * Show popup at card position with water emerge animation
 */
export function showPopupAtCard(project, card) {
    currentProjectIndex = projectsList.findIndex(p => p === project);
    if (currentProjectIndex === -1) currentProjectIndex = 0;
    currentProject = project;
    
    // Set modal size - viewport-responsive for large screens (2056px+)
    const vw = window.innerWidth;
    let maxModalW = 900, maxModalH = 800;
    if (vw >= 3840) {
        maxModalW = 1800; maxModalH = 1400;
    } else if (vw >= 2560) {
        maxModalW = 1400; maxModalH = 1100;
    } else if (vw >= 2056) {
        maxModalW = 1100; maxModalH = 900;
    }
    const modalWidth = Math.min(maxModalW, vw - 60);
    const modalHeight = Math.min(maxModalH, window.innerHeight - 80);
    const left = (vw - modalWidth) / 2;
    const top = (window.innerHeight - modalHeight) / 2;
    
    // Position modal
    modalContainer.style.position = 'fixed';
    modalContainer.style.left = `${left}px`;
    modalContainer.style.top = `${top}px`;
    modalContainer.style.width = `${modalWidth}px`;
    modalContainer.style.maxHeight = `${modalHeight}px`;
    
    // Remove any previous animation class
    modalContainer.classList.remove('water-emerge', 'fade-complete');
    void modalContainer.offsetWidth;
    
    // Show overlay
    modalOverlay.style.display = 'block';
    modalOverlay.style.opacity = '0';
    void modalOverlay.offsetHeight;
    modalOverlay.style.transition = 'opacity 0.3s ease';
    modalOverlay.style.opacity = '1';
    
    // Show modal with water emerge animation (SVG filter)
    modalContainer.style.display = 'block';
    modalContainer.style.opacity = '1';
    modalContainer.style.transform = 'scale(1)';
    
    // Restart SVG animation by triggering all animate elements
    const svgFilter = document.getElementById('water-emerge');
    if (svgFilter) {
        const animations = svgFilter.querySelectorAll('animate');
        animations.forEach(anim => {
            try {
                anim.beginElement();
            } catch (e) {
                // Fallback: clone filter if beginElement fails
                const parent = svgFilter.parentNode;
                const clone = svgFilter.cloneNode(true);
                parent.replaceChild(clone, svgFilter);
            }
        });
    }
    
    // Trigger the water emerge animation
    modalContainer.classList.add('water-emerge');
    
    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
    }
    modalContainer._emergeTimer = setTimeout(() => {
        // Remove water-emerge class - SVG filter already at scale=0
        modalContainer.classList.remove('water-emerge');
    }, 1000); // after SVG animation completes (0.8s + buffer)
    
    // Start voronoi shader background with project-specific color scheme
    if (modalShader) {
        modalShader.start(currentProjectIndex);
    }
    
    // Populate content
    populateModal(project);
    
    document.body.style.overflow = 'hidden';
}

/**
 * Close popup with water animation
 */
function closePopup() {
    if (!currentProject) return;
    
    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
        modalContainer._emergeTimer = null;
    }
    
    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }
    
    modalContainer.classList.remove('water-emerge', 'fade-complete');
    const modalContent = modalContainer.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.filter = '';
        modalContent.style.webkitFilter = '';
    }
    
    // Trigger water-distort-close SVG animation (same as water-emerge opening)
    const closeFilter = document.getElementById('water-distort-close');
    if (closeFilter) {
        const animations = closeFilter.querySelectorAll('animate');
        animations.forEach(anim => {
            try {
                anim.beginElement();
            } catch (e) {
                const parent = closeFilter.parentNode;
                const clone = closeFilter.cloneNode(true);
                parent.replaceChild(clone, closeFilter);
            }
        });
    }
    
    // Add water effect to close button
    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.classList.add('water-effect');
    }
    
    // Trigger water close animation
    modalContainer.classList.add('water-close');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('water-close');
        if (closeBtn) {
            closeBtn.classList.remove('water-effect');
        }
        // Stop shader only AFTER hiding to prevent text flicker during close
        if (modalShader) {
            modalShader.stop();
        }
        currentProject = null;
        document.body.style.overflow = '';
    }, 1000);
}

/**
 * Populate modal with project data
 */
function populateModal(project) {
    const titleEl = modalContainer.querySelector('.modal-project-title');
    const subtitleEl = modalContainer.querySelector('.modal-project-subtitle');
    const imageEl = modalContainer.querySelector('.modal-project-image');
    const descriptionEl = modalContainer.querySelector('.modal-project-description');
    const skillsGridEl = modalContainer.querySelector('.modal-skills-grid');
    
    const lang = getCurrentLang();
    const projectIndex = projectsList.findIndex(p => p === project);
    
    // Apply water-themed background based on project
    const bgClasses = ['modal-bg-abyss', 'modal-bg-teal', 'modal-bg-ocean', 'modal-bg-bio'];
    modalContainer.classList.remove(...bgClasses);
    if (projectIndex >= 0 && projectIndex < bgClasses.length) {
        modalContainer.classList.add(bgClasses[projectIndex]);
    }
    
    titleEl.textContent = project.name;
    subtitleEl.textContent = getProjectDescription(projectIndex, lang) || project.description || '';
    imageEl.src = project.image || '';
    imageEl.alt = project.name;
    descriptionEl.textContent = getProjectFullDescription(projectIndex, lang) || project.fullDescription || '';
    
    skillsGridEl.innerHTML = '';
    let skillCycleTimer = null;
    if (project.skills && project.skills.length > 0) {
        project.skills.forEach((skill, index) => {
            const skillTag = document.createElement('span');
            skillTag.className = 'modal-skill-tag';
            if (skill.icon) {
                skillTag.innerHTML = `<i class='bx ${skill.icon}'></i> ${skill.name}`;
            } else {
                skillTag.textContent = skill.name || skill;
            }
            skillsGridEl.appendChild(skillTag);
        });

        const tags = skillsGridEl.querySelectorAll('.modal-skill-tag');
        let currentSkillIndex = 0;

        function activateSkill(index) {
            tags.forEach(t => t.classList.remove('active'));
            if (tags[index]) tags[index].classList.add('active');
        }

        function nextSkill() {
            currentSkillIndex = (currentSkillIndex + 1) % tags.length;
            activateSkill(currentSkillIndex);
        }

        if (tags.length > 0) {
            activateSkill(0);
            skillCycleTimer = setInterval(nextSkill, 10000);
        }
    }

    const cleanupCycle = () => {
        if (skillCycleTimer) {
            clearInterval(skillCycleTimer);
            skillCycleTimer = null;
        }
    };
    modalContainer._cleanupCycle = cleanupCycle;
}
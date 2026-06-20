/* ========================================= */
/* PROJECT MODAL MODULE - SIMPLE POPUP */
/* ========================================= */

import { getCurrentLang } from './language.js';
import { getProjectFullDescription, getProjectDescription } from '../constants/projects.js';

/**
 * Simple popup modal that appears at the clicked card position
 */

let modalOverlay = null;
let modalContainer = null;
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
    // Create overlay (darker background)
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'project-modal-overlay';
    
    // Create modal container
    modalContainer = document.createElement('div');
    modalContainer.className = 'project-modal';
    
    // Create modal content
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
    
    // Append elements
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
}

/**
 * Attach event listeners (card clicks handled by portal.js)
 */
function attachEventListeners(projects) {
    projectsList = projects;
    
    // Close button
    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => closePopup());
    
    // Prev/Next buttons
    const prevBtn = modalContainer.querySelector('.modal-prev-btn');
    const nextBtn = modalContainer.querySelector('.modal-next-btn');
    prevBtn.addEventListener('click', () => navigateProject(-1));
    nextBtn.addEventListener('click', () => navigateProject(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
        if (e.key === 'ArrowLeft') navigateProject(-1);
        if (e.key === 'ArrowRight') navigateProject(1);
    });
    
    // Click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePopup();
    });
}

/**
 * Navigate to previous/next project
 */
function navigateProject(direction) {
    if (!projectsList.length) return;
    currentProjectIndex = (currentProjectIndex + direction + projectsList.length) % projectsList.length;
    const project = projectsList[currentProjectIndex];
    currentProject = project;
    populateModal(project);
}

/**
 * Show popup at card position
 */
export function showPopupAtCard(project, card) {
    // Find project index from projectsList
    currentProjectIndex = projectsList.findIndex(p => p === project);
    if (currentProjectIndex === -1) currentProjectIndex = 0;
    currentProject = project;
    
    // Get card position and size
    const cardRect = card.getBoundingClientRect();
    
    // Set modal size (larger for images)
    const modalWidth = Math.min(900, window.innerWidth - 60);
    const modalHeight = Math.min(800, window.innerHeight - 80);
    
    // Calculate position - center on screen (not on card)
    const left = (window.innerWidth - modalWidth) / 2;
    const top = (window.innerHeight - modalHeight) / 2;
    
    // Position the overlay
    modalOverlay.style.display = 'block';
    modalOverlay.style.opacity = '0';
    
    // Force reflow
    modalOverlay.offsetHeight;
    
    // Fade in overlay
    modalOverlay.style.transition = 'opacity 0.3s ease';
    modalOverlay.style.opacity = '1';
    
    // Position and show modal
    modalContainer.style.position = 'fixed';
    modalContainer.style.left = `${left}px`;
    modalContainer.style.top = `${top}px`;
    modalContainer.style.width = `${modalWidth}px`;
    modalContainer.style.maxHeight = `${modalHeight}px`;
    modalContainer.style.display = 'block';
    modalContainer.style.opacity = '0';
    modalContainer.style.transform = 'scale(0.9)';
    
    // Force reflow
    modalContainer.offsetHeight;
    
    // Fade in and scale up modal
    modalContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    modalContainer.style.opacity = '1';
    modalContainer.style.transform = 'scale(1)';
    
    // Populate content
    populateModal(project);
    
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
}

/**
 * Close popup
 */
function closePopup() {
    if (!currentProject) return;
    
    // Cleanup skill cycle
    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }
    
    // Fade out
    modalOverlay.style.opacity = '0';
    modalContainer.style.opacity = '0';
    modalContainer.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        currentProject = null;
        document.body.style.overflow = '';
    }, 300);
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
    
    titleEl.textContent = project.name;
    subtitleEl.textContent = getProjectDescription(projectIndex, lang) || project.description || '';
    imageEl.src = project.image || '';
    imageEl.alt = project.name;
    descriptionEl.textContent = getProjectFullDescription(projectIndex, lang) || project.fullDescription || '';
    
    // Set skills
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

        // Cycle through skills: 3s active each, then next
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

        // Start cycle
        if (tags.length > 0) {
            activateSkill(0);
            skillCycleTimer = setInterval(nextSkill, 10000);
        }
    }

    // Cleanup cycle when modal closes
    const cleanupCycle = () => {
        if (skillCycleTimer) {
            clearInterval(skillCycleTimer);
            skillCycleTimer = null;
        }
    };
    // Store cleanup on modal container so closePopup can call it
    modalContainer._cleanupCycle = cleanupCycle;
}
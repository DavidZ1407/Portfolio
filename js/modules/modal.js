/* ========================================= */
/* PROJECT MODAL MODULE - SIMPLE POPUP */
/* ========================================= */

/**
 * Simple popup modal that appears at the clicked card position
 */

let modalOverlay = null;
let modalContainer = null;
let currentProject = null;

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
    // Card click handlers are managed by portal.js (portal opening animation)
    
    // Close button
    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => closePopup());
    
    // Click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closePopup();
        }
    });
    
    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePopup();
        }
    });
}

/**
 * Show popup at card position
 */
export function showPopupAtCard(project, card) {
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
    
    titleEl.textContent = project.name;
    subtitleEl.textContent = project.description || '';
    imageEl.src = project.image || '';
    imageEl.alt = project.name;
    descriptionEl.textContent = project.fullDescription || project.description || '';
    
    // Set skills
    skillsGridEl.innerHTML = '';
    if (project.skills && project.skills.length > 0) {
        project.skills.forEach(skill => {
            const skillTag = document.createElement('span');
            skillTag.className = 'modal-skill-tag';
            if (skill.icon) {
                skillTag.innerHTML = `<i class='bx ${skill.icon}'></i> ${skill.name}`;
            } else {
                skillTag.textContent = skill.name || skill;
            }
            skillsGridEl.appendChild(skillTag);
        });
    }
}
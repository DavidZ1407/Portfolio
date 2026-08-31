/**
 * File: modal.js
 * Description: Project modal: open/close water animations, media viewer, lightbox, thumbnails, and keyboard navigation.
 */
import { getCurrentLang } from './language.js';
import { LARGE_BREAKPOINT_PX, XLARGE_BREAKPOINT_PX, FOUR_K_BREAKPOINT_PX, CANVAS_BACKING_MAX_WIDTH } from '../constants/ui.js';
import {
    getProjectDescription,
    getProjectContribution,
    getCategoryLabel,
    getProjectIndicesByCategory,
    getSiblingProjectIndex,
    getCategories,
    getFirstProjectOfCategory,
    getAdjacentCategoryProject,
    getCategorySchemeIndex,
    applyImageFallback,
    getProjectGameConcept,
    getProjectDuration,
    getProjectTeam,
    getProjectTitle,
    getProjectTools,
    getProjectSkills,
    getProjectCoveredToolNames,
    getProjectLinks,
} from '../constants/projects.js?v=9';
import { skillIconHtml } from '../constants/skills.js?v=4';
import { initModalShader } from './modal_shader.js';

let modalOverlay = null;
let modalContainer = null;
let modalShader = null;
let currentProject = null;
let projectsList = [];
let currentProjectIndex = 0;
let currentMediaIndex = 0;

// Lightbox state (fullscreen view of the media viewer)
let lightboxOverlay = null;
let lightboxContainer = null;
let lightboxImage = null;
let lightboxVideo = null;
let lightboxOpen = false;
let lightboxCloseTimer = null;

/* ---- Timing / Animation constants ---- */
const WATER_ANIMATION_MS = 1000;      // duration of the SVG water morph animation (0.8s + buffer; matches --water-close-duration in modal.css)
const PROJECT_GLOW_MS = 420;          // display duration of the project glow feedback (matches --media-nav-glow-duration in modal.css)

/* ---- Viewport-responsive modal sizes ---- */
// Size preset per large breakpoint (2056px+). Smaller viewports fall back to the default.
const MODAL_SIZE_PRESETS = [
    { minWidth: FOUR_K_BREAKPOINT_PX, width: 1800, height: 1400 },
    { minWidth: CANVAS_BACKING_MAX_WIDTH, width: 1400, height: 1100 },
    { minWidth: LARGE_BREAKPOINT_PX, width: 1100, height: 900 },
];
const MODAL_DEFAULT_SIZE = { minWidth: 0, width: 900, height: 800 };
const MODAL_VIEWPORT_MARGIN_X = 60;   // modal distance to the viewport edge (horizontal)
const MODAL_VIEWPORT_MARGIN_Y = 80;   // modal distance to the viewport edge (vertical)

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
    modalOverlay.className = 'project_modal_overlay';

    modalContainer = document.createElement('div');
    modalContainer.className = 'project_modal';

    modalContainer.innerHTML = `
        <button class="modal_close_btn" aria-label="Close">✕</button>

        <div class="modal_content">
            <div class="modal_cat_tabs" role="tablist" aria-label="Project categories"></div>

            <!-- LABEL ABOVE THE PROJECT SELECTION BAR -->
            <div class="modal_project_bar_label">Projects in this category</div>

            <!-- PROJECT SELECTION BAR (level 2: projects within the current category) -->
            <div class="modal_project_bar" role="group" aria-label="Projects in category"></div>

            <div class="modal_project_header">
                <h2 class="modal_project_title"></h2>
                <div class="modal_project_switch">
                    <button class="modal_project_prev" aria-label="Previous project" title="">‹</button>
                    <span class="modal_project_switch_label"></span>
                    <button class="modal_project_next" aria-label="Next project" title="">›</button>
                </div>
            </div>

            <!-- MAIN MEDIA VIEWER -->
            <div class="modal_media_viewer">
                <div class="modal_media_stage">
                    <img class="modal_media_image" src="" alt="" loading="lazy" decoding="async">
                    <video class="modal_media_video" playsinline preload="metadata"></video>
                    <div class="modal_media_youtube" hidden></div>
                    <button class="modal_media_play" aria-label="Play video">▶</button>
                </div>
                <button class="modal_media_prev" aria-label="Previous media">‹</button>
                <button class="modal_media_next" aria-label="Next media">›</button>
            </div>

            <!-- THUMBNAIL BAR -->
            <div class="modal_thumb_bar"></div>

            <!-- TWO-COLUMN SECTION -->
            <div class="modal_info_grid">
                <div class="modal_description_col">
                    <p class="modal_project_description"></p>
                    <div class="modal_game_concept" hidden>
                        <h3 class="modal_game_concept_title">Game Concept</h3>
                        <p class="modal_game_concept_text"></p>
                    </div>
                    <div class="modal_project_details" hidden>
                        <h3 class="modal_details_title">Project Details</h3>
                        <div class="modal_details_list"></div>
                    </div>
                    <div class="modal_project_links" hidden>
                        <h3 class="modal_links_title">Links & Demos</h3>
                        <div class="modal_links_grid"></div>
                    </div>
                </div>
                <div class="modal_contribution_col">
                    <h3 class="modal_contribution_title">My Contribution</h3>
                    <ul class="modal_contribution_list"></ul>
                </div>
            </div>

            <!-- TOOLS & SKILLS -->
            <div class="modal_skills_section">
                <h3 class="modal_skills_title">Tools & Skills used</h3>
                <div class="modal_skills_grid"></div>
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    // Wire up media events (play button/video) once
    setupMediaEvents();

    // Create and wire up the lightbox for the large media viewer (fullscreen)
    createLightbox();
    setupLightbox();

    // Initialize voronoi shader background (unchanged)
    modalShader = initModalShader(modalContainer);
}

/**
 * Attach event listeners
 */
function attachEventListeners(projects) {
    projectsList = projects;

    const closeBtn = modalContainer.querySelector('.modal_close_btn');
    closeBtn.addEventListener('click', () => closePopup());

    const mediaPrev = modalContainer.querySelector('.modal_media_prev');
    const mediaNext = modalContainer.querySelector('.modal_media_next');
    mediaPrev.addEventListener('click', () => navigateMedia(-1));
    mediaNext.addEventListener('click', () => navigateMedia(1));

    const projectPrev = modalContainer.querySelector('.modal_project_prev');
    const projectNext = modalContainer.querySelector('.modal_project_next');
    projectPrev.addEventListener('click', () => navigateProject(-1));
    projectNext.addEventListener('click', () => navigateProject(1));

    // Category tabs + category arrows (delegation: rebuilt dynamically)
    const catTabs = modalContainer.querySelector('.modal_cat_tabs');
    catTabs.addEventListener('click', (e) => {
        if (e.target.closest('.modal_cat_prev')) { navigateCategory(-1); return; }
        if (e.target.closest('.modal_cat_next')) { navigateCategory(1); return; }
        const tab = e.target.closest('.modal_cat_tab');
        if (tab && tab.dataset.category) {
            switchCategory(tab.dataset.category);
        }
    });

    // Project selection bar (level 2) - click delegation
    const projectBar = modalContainer.querySelector('.modal_project_bar');
    if (projectBar) {
        projectBar.addEventListener('click', (e) => {
            const item = e.target.closest('.modal_project_item');
            if (item && item.dataset.index !== undefined) {
                switchToProjectIndex(parseInt(item.dataset.index));
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Close the lightbox if open - modal stays open
            if (lightboxOpen) { closeLightbox(); return; }
            closePopup();
            return;
        }
        // Ctrl+arrow -> switch between CATEGORIES
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigateCategory(e.key === 'ArrowLeft' ? -1 : 1);
            return;
        }
        // Alt+arrow -> switch between projects of the same category
        if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); navigateProject(-1); return; }
        if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); navigateProject(1); return; }
        if (e.key === 'ArrowLeft') navigateMedia(-1);
        if (e.key === 'ArrowRight') navigateMedia(1);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePopup();
    });

    // When the language is switched while a modal is open,
    // re-populate the modal content in the new language
    document.addEventListener('languageChanged', () => {
        if (currentProject) {
            populateModal(currentProject);
        }
    });
}

/**
 * Navigate between media items of the current project.
 * Used by the in-viewer arrows and keyboard arrows.
 */
function navigateMedia(direction) {
    if (!currentProject || !Array.isArray(currentProject.media) || currentProject.media.length === 0) return;
    const total = currentProject.media.length;
        currentMediaIndex = (currentMediaIndex + direction + total) % total;
    showMedia(currentMediaIndex);
    triggerMediaFeedback();
}

/**
 * Switch between projects of the SAME category.
 * Automatically resets the media navigation to the first item.
 * If the category has only one project, nothing happens
 * (the arrows are disabled/gray in that case).
 */
function switchCategory(category) {
    const target = getFirstProjectOfCategory(category);
    if (target === null || target === undefined) return;
    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;
        // populateModal sets the shader color, resets media to 0 and rebuilds everything
    populateModal(currentProject);
    triggerProjectFeedback();
}

/**
 * Switch between projects of the SAME category.
 * Automatically resets the media navigation to the first item.
 */
function navigateProject(direction) {
    if (!currentProject) return;
    // callers pass -1/+1 - getSiblingProjectIndex expects 'prev'/'next'
    const dirName = direction < 0 ? 'prev' : 'next';
    const target = getSiblingProjectIndex(currentProjectIndex, dirName);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

        // Resets currentMediaIndex to 0 + rebuilds everything (incl. shader color)
    populateModal(currentProject);
    triggerProjectFeedback();
}

/**
 * Switch between CATEGORIES (e.g. Game Dev -> Sound).
 * Moves to the first project of the adjacent category.
 */
function navigateCategory(direction) {
    if (!currentProject) return;
    // callers pass -1/+1 - getAdjacentCategoryProject expects 'prev'/'next'
    const dirName = direction < 0 ? 'prev' : 'next';
    const target = getAdjacentCategoryProject(currentProjectIndex, dirName);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

    populateModal(currentProject);
    // Also highlight the newly activated project tab on category switch
    triggerProjectFeedback();
}

/**
 * Builds the category tabs into the modal.
 * The active tab marks the currently open category.
 */
function buildCategoryTabs() {
    const tabsEl = modalContainer.querySelector('.modal_cat_tabs');
    if (!tabsEl) return;
    const lang = getCurrentLang();

    tabsEl.innerHTML = '';

    // CATEGORY arrow back (<<) - cyclic like navigateCategory (wrap-around)
    const catPrevBtn = document.createElement('button');
    catPrevBtn.className = 'modal_cat_prev';
    catPrevBtn.textContent = '«';
    catPrevBtn.setAttribute('aria-label', 'Previous category');
    tabsEl.appendChild(catPrevBtn);

    getCategories().forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'modal_cat_tab';
        btn.dataset.category = cat;
        btn.setAttribute('role', 'tab');
        const active = currentProject && currentProject.category === cat;
        if (active) btn.classList.add('active');
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
        btn.title = getCategoryLabel(cat, lang);
        btn.textContent = getCategoryLabel(cat, lang);
        tabsEl.appendChild(btn);
    });

    // CATEGORY arrow forward (>>) - cyclic like navigateCategory (wrap-around)
    const catNextBtn = document.createElement('button');
    catNextBtn.className = 'modal_cat_next';
    catNextBtn.textContent = '»';
    catNextBtn.setAttribute('aria-label', 'Next category');
    tabsEl.appendChild(catNextBtn);
}

/**
 * Updates category tabs + project switcher.
 * The project switcher is only shown when the category has
 * MULTIPLE projects (otherwise hidden, no confusing arrows).
 */
function updateProjectNav() {
    // Rebuild tabs (active one = current category)
    buildCategoryTabs();

    const lang = getCurrentLang();

    const switchRow = modalContainer.querySelector('.modal_project_switch');
    const prevBtn = modalContainer.querySelector('.modal_project_prev');
    const nextBtn = modalContainer.querySelector('.modal_project_next');
    const labelEl = modalContainer.querySelector('.modal_project_switch_label');

    const hasSiblings = currentProject
        ? getProjectIndicesByCategory(currentProject.category).length > 1
        : false;

    if (switchRow) switchRow.style.display = hasSiblings ? 'flex' : 'none';

    if (prevBtn && nextBtn && currentProject) {
        const indices = getProjectIndicesByCategory(currentProject.category);
        const pos = indices.indexOf(currentProjectIndex);
        const prevIdx = hasSiblings ? indices[(pos - 1 + indices.length) % indices.length] : -1;
        const nextIdx = hasSiblings ? indices[(pos + 1) % indices.length] : -1;
        prevBtn.title = prevIdx >= 0 && projectsList[prevIdx] ? getProjectTitle(prevIdx, lang) : '';
        nextBtn.title = nextIdx >= 0 && projectsList[nextIdx] ? getProjectTitle(nextIdx, lang) : '';
        prevBtn.disabled = !hasSiblings;
        nextBtn.disabled = !hasSiblings;
        prevBtn.classList.toggle('disabled', !hasSiblings);
        nextBtn.classList.toggle('disabled', !hasSiblings);
        if (labelEl) labelEl.textContent = hasSiblings ? `${pos + 1} / ${indices.length}` : '';
    }
}

/**

/**
 * Builds the project selection bar (level 2) for the current category.
 * Shows all projects of the category as clickable cards with cover + title.
 * The currently selected project gets the 'active' class.
 */
/**
 * Creates a muted <video> preview element that uses preload=metadata to
 * show the first frame of the animation - so video thumbnails/cards look
 * like the animation itself, not like a static placeholder image.
 */
function createVideoPreviewElement(src) {
    const vid = document.createElement('video');
    vid.src = src || '';
    vid.muted = true;
    vid.preload = 'metadata';
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('aria-hidden', 'true');
    // Small time jump so the browser reliably renders the first frame
    vid.addEventListener('loadeddata', () => {
        try { vid.currentTime = 0.001; } catch (e) { /* ignore */ }
    }, { once: true });
    return vid;
}

function buildProjectBar() {
    const bar = modalContainer.querySelector('.modal_project_bar');
    if (!bar) return;
    bar.innerHTML = '';
    if (!currentProject) return;
    const lang = getCurrentLang();

    const indices = getProjectIndicesByCategory(currentProject.category);
    indices.forEach(idx => {
        const project = projectsList[idx];
        if (!project) return;

        const item = document.createElement('button');
        item.className = 'modal_project_item';
        item.dataset.index = String(idx);
        item.setAttribute('role', 'tab');
        const isActive = idx === currentProjectIndex;
        item.classList.toggle('active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');

        const media = Array.isArray(project.media) ? project.media : [];
        const firstMedia = media[0];
        // Pure video projects: card preview shows the first frame of the first animation.
        // Mixed projects (video + images) show the cover image instead.
        const isPureVideoProject = Boolean(firstMedia && firstMedia.type === 'video' && !media.some(m => m && m.type === 'image'));
        if (isPureVideoProject) {
            item.appendChild(createVideoPreviewElement(firstMedia.src));
        } else {
            const img = document.createElement('img');
            img.src = project.cover || (firstMedia && (firstMedia.thumb || firstMedia.src)) || '';
            img.alt = getProjectTitle(idx, lang);
            img.loading = 'lazy';
            img.decoding = 'async';
            applyImageFallback(img, project.category);
            item.appendChild(img);
        }

        const label = document.createElement('span');
        label.className = 'modal_project_item_label';
        label.textContent = getProjectTitle(idx, lang);
        item.appendChild(label);

        bar.appendChild(item);
    });
}

/**
 * Switches to any project (via the project selection bar etc.).
 * Sets currentProjectIndex + currentProject and rebuilds the modal completely.
 */
function switchToProjectIndex(index) {
    if (!projectsList[index]) return;
    currentProjectIndex = index;
        currentProject = projectsList[index];
    if (!currentProject) return;
    populateModal(currentProject);
    triggerProjectFeedback();
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
    const sizePreset = MODAL_SIZE_PRESETS.find(p => vw >= p.minWidth) || MODAL_DEFAULT_SIZE;
    const maxModalW = sizePreset.width;
    const maxModalH = sizePreset.height;
    const modalWidth = Math.min(maxModalW, vw - MODAL_VIEWPORT_MARGIN_X);
    const modalHeight = Math.min(maxModalH, window.innerHeight - MODAL_VIEWPORT_MARGIN_Y);
    const left = (vw - modalWidth) / 2;

    // Position the modal below the fixed main navbar so the title/X button
    // are never covered by the navbar when it sits above the overlay.
    const headerEl = document.querySelector('.header');
    const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
    const centerTop = (window.innerHeight - modalHeight) / 2;
    const top = Math.max(headerBottom + 14, centerTop);

    // Position modal
    modalContainer.style.position = 'fixed';
    modalContainer.style.left = `${left}px`;
    modalContainer.style.top = `${top}px`;
    modalContainer.style.width = `${modalWidth}px`;
    modalContainer.style.maxHeight = `${modalHeight}px`;

    // Remove any previous animation class
    modalContainer.classList.remove('water_emerge', 'fade_complete');
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
    const svgFilter = document.getElementById('water_emerge');
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
    modalContainer.classList.add('water_emerge');

    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
    }
    modalContainer._emergeTimer = setTimeout(() => {
        // Remove water_emerge class - SVG filter already at scale=0
        modalContainer.classList.remove('water_emerge');
    }, WATER_ANIMATION_MS); // after SVG animation completes (0.8s + buffer)

    // Populate content (including media + thumbnails)
    // The shader is started here with the matching category color
    populateModal(project);

    // Set scroll lock + modal-open state on body (navbar stays above the overlay via CSS)
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
}

/**
 * Restarts the water close SVG animation (water_distort_close) and throws
 * the water effect onto the close button. ONLY place for this flow -
 * used by modal close (closePopup) and lightbox close (closeLightbox),
 * so the code is not duplicated.
 */
function restartWaterCloseAnimation(closeBtn) {
    const closeFilter = document.getElementById('water_distort_close');
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
    if (closeBtn) closeBtn.classList.add('water_effect');
}

/**
 * ALWAYS reset body scroll + modal-open state.
 * Executed synchronously (even during the close animation) so
 * navigation/scrolling work again immediately - never a "scroll-locked" state.
 */
function unlockBodyScroll() {
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

/**
 * Close popup with water animation.
 * @param {boolean} immediate - true = close immediately without the water close animation
 *   (used when navigating via the main navbar).
 */
function closePopup(immediate = false) {
    if (!currentProject) return;

    // Close the lightbox if still open
    if (lightboxOpen) closeLightbox();

    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
        modalContainer._emergeTimer = null;
    }

    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }

    // Pause any playing video before closing
    const video = modalContainer.querySelector('.modal_media_video');
    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }

    modalContainer.classList.remove('water_emerge', 'fade_complete');
    const modalContent = modalContainer.querySelector('.modal_content');
    if (modalContent) {
        modalContent.style.filter = '';
        modalContent.style.webkitFilter = '';
    }

    const closeBtn = modalContainer.querySelector('.modal_close_btn');

    // Release scroll lock + modal-open class immediately (navigation should scroll right away).
    unlockBodyScroll();

    if (immediate) {
        // Hide immediately without the close animation (e.g. when clicking a navbar link).
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('water_close');
        if (closeBtn) {
            closeBtn.classList.remove('water_effect');
        }
        if (modalShader) {
            modalShader.stop();
        }
        currentProject = null;
        return;
    }

    // Trigger water_distort_close SVG animation (same as water_emerge opening)
    restartWaterCloseAnimation(closeBtn);

    // Trigger water close animation
    modalContainer.classList.add('water_close');

    // Wait for animation to complete before hiding
    setTimeout(() => {
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('water_close');
        if (closeBtn) {
            closeBtn.classList.remove('water_effect');
        }
        // Stop shader only AFTER hiding to prevent text flicker during close
        if (modalShader) {
            modalShader.stop();
        }
        currentProject = null;
    }, WATER_ANIMATION_MS);
}

/**
 * Reusable: exported function to close the project modal from outside
 * (e.g. from the navigation). Equivalent to closePopup().
 * @param {{ immediate?: boolean }} options
 */
export function closeProjectModal(options = {}) {
    closePopup(Boolean(options.immediate));
}

/**
 * Reusable: is a project modal currently open?
 */
export function isProjectModalOpen() {
    return Boolean(currentProject);
}

/**
 * Populate modal with project data (new structure)
 */
function populateModal(project) {
    const lang = getCurrentLang();

    // Close the lightbox if a different project is loaded
    if (lightboxOpen) closeLightbox();

    // Water background based on category (CSS gradient + shader color)
    const bgClasses = ['modal_bg_abyss', 'modal_bg_teal', 'modal_bg_ocean', 'modal_bg_bio', 'modal_bg_amber', 'modal_bg_rose'];
    modalContainer.classList.remove(...bgClasses);
    const scheme = currentProject ? getCategorySchemeIndex(currentProject.category) : 0;
    if (scheme >= 0 && scheme < bgClasses.length) {
        modalContainer.classList.add(bgClasses[scheme]);
    }
    // Set the category shader color (also works while the shader is running)
    if (modalShader) {
        modalShader.start(scheme);
    }

    // Header
    const titleEl = modalContainer.querySelector('.modal_project_title');
    titleEl.textContent = getProjectTitle(currentProjectIndex, lang);

    // Set the label above the project selection bar in the current language
    const barLabelEl = modalContainer.querySelector('.modal_project_bar_label');
    if (barLabelEl) barLabelEl.textContent = lang === 'de' ? 'Projekte in dieser Kategorie' : 'Projects in this category';

    // Build the project selection bar for the current category (level 2)
    buildProjectBar();

    // Description (left column)
    const descriptionEl = modalContainer.querySelector('.modal_project_description');
    descriptionEl.textContent = getProjectDescription(currentProjectIndex, lang);

    // Game concept (only visible if the project has a gameConcept field)
    const gameConceptEl = modalContainer.querySelector('.modal_game_concept');
    const gameConceptTextEl = modalContainer.querySelector('.modal_game_concept_text');
    const conceptTitleEl = modalContainer.querySelector('.modal_game_concept_title');
    if (conceptTitleEl) conceptTitleEl.textContent = lang === 'de' ? 'Spielkonzept' : 'Game Concept';
    const gameConcept = getProjectGameConcept(currentProjectIndex, lang);
    gameConceptTextEl.textContent = gameConcept;
    gameConceptEl.hidden = !gameConcept;

    // Project details (duration/team - only visible if the project has values)
    const detailsEl = modalContainer.querySelector('.modal_project_details');
    const detailsTitleEl = modalContainer.querySelector('.modal_details_title');
    if (detailsTitleEl) detailsTitleEl.textContent = lang === 'de' ? 'Projektdetails' : 'Project Details';
    const detailsListEl = modalContainer.querySelector('.modal_details_list');
    const durationValue = getProjectDuration(currentProjectIndex, lang);
    const teamValue = getProjectTeam(currentProjectIndex, lang);
    const detailItems = [];
    if (durationValue) detailItems.push([lang === 'de' ? 'Dauer' : 'Duration', durationValue]);
    if (teamValue) detailItems.push(['Team', teamValue]);
    detailsListEl.innerHTML = '';
    detailItems.forEach(detail => {
        const item = document.createElement('div');
        item.className = 'modal_detail_item';
        const labelEl = document.createElement('span');
        labelEl.className = 'modal_detail_label';
        labelEl.textContent = detail[0];
        const valueEl = document.createElement('span');
        valueEl.className = 'modal_detail_value';
        valueEl.textContent = detail[1];
        item.appendChild(labelEl);
        item.appendChild(valueEl);
        detailsListEl.appendChild(item);
    });
    detailsEl.hidden = detailItems.length === 0;

    // Links & demos (only visible if the project has links)
    const linksEl = modalContainer.querySelector('.modal_project_links');
    const linksTitleEl = modalContainer.querySelector('.modal_links_title');
    if (linksTitleEl) linksTitleEl.textContent = lang === 'de' ? 'Links & Demos' : 'Links & Demos';
    const linksGridEl = modalContainer.querySelector('.modal_links_grid');
    const links = getProjectLinks(currentProjectIndex, lang);
    linksGridEl.innerHTML = '';
    links.forEach(link => {
        const a = document.createElement('a');
        a.className = 'modal_link_btn';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.innerHTML = `<i class='bx bx-link-external'></i> ${link.label}`;
        linksGridEl.appendChild(a);
    });
    linksEl.hidden = links.length === 0;

    // Contribution (right column)
    const contributionTitleEl = modalContainer.querySelector('.modal_contribution_title');
    if (contributionTitleEl) contributionTitleEl.textContent = lang === 'de' ? 'Mein Beitrag' : 'My Contribution';
    const contributionList = modalContainer.querySelector('.modal_contribution_list');
    const contributions = getProjectContribution(currentProjectIndex, lang);
    contributionList.innerHTML = '';
    // Supports two formats (backward compatible):
    //  - String           -> normal list item
    //  - { intro: ... }   -> intro paragraph without a bullet
    //  - { group, items } -> group heading + its own item list
    contributions.forEach(item => {
        if (item && typeof item === 'object') {
            if (item.intro) {
                const p = document.createElement('p');
                p.className = 'modal_contribution_intro';
                p.textContent = item.intro;
                contributionList.appendChild(p);
            } else if (item.group) {
                const h5 = document.createElement('h5');
                h5.className = 'modal_contribution_group_title';
                h5.textContent = item.group;
                const subList = document.createElement('ul');
                subList.className = 'modal_contribution_list modal_contribution_sublist';
                (item.items || []).forEach(text => {
                    const li = document.createElement('li');
                    li.textContent = text;
                    subList.appendChild(li);
                });
                contributionList.appendChild(h5);
                contributionList.appendChild(subList);
            }
            return;
        }
        const li = document.createElement('li');
        li.textContent = item;
        contributionList.appendChild(li);
    });

    // Tools & Skills
    const skillsTitleEl = modalContainer.querySelector('.modal_skills_title');
    if (skillsTitleEl) skillsTitleEl.textContent = lang === 'de' ? 'Tools & Skills' : 'Tools & Skills used';
    const skillsGridEl = modalContainer.querySelector('.modal_skills_grid');
    skillsGridEl.innerHTML = '';

    // 1) Portfolio skills (coupled to the skill registry, see skills.js)
    //    -> same blue/teal tags as all other tools in the modal
    const projectSkills = getProjectSkills(currentProjectIndex);
    projectSkills.forEach((skill) => {
        const tag = document.createElement('span');
        tag.className = 'modal_skill_tag';
        tag.setAttribute('data-skill-id', skill.id);
        tag.innerHTML = `${skillIconHtml(skill)} ${skill.name}`;
        skillsGridEl.appendChild(tag);
    });

    // 2) Other tools of the project (without the skills already covered above)
    const coveredTools = getProjectCoveredToolNames(currentProjectIndex);
    const tools = getProjectTools(currentProjectIndex, lang);
    tools.forEach((tool) => {
        if (coveredTools.has((tool.name || '').toLowerCase())) return;
        const tag = document.createElement('span');
        tag.className = 'modal_skill_tag';
        if (tool.icon) {
            tag.innerHTML = `<i class='bx ${tool.icon}'></i> ${tool.name}`;
        } else {
            tag.textContent = tool.name;
        }
        skillsGridEl.appendChild(tag);
    });

    // Media + thumbnails
    currentMediaIndex = 0;
    buildThumbnails(project);
    showMedia(0);

    // Goal: update the project navigation (label, tooltips, disabling)
    updateProjectNav();

    // Clean up old cycle timer
    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }
}

/**
 * Build the thumbnail bar for all media of the project
 */
function buildThumbnails(project) {
    const bar = modalContainer.querySelector('.modal_thumb_bar');
    bar.innerHTML = '';

    const media = Array.isArray(project.media) ? project.media : [];
    media.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'modal_thumb';
        btn.setAttribute('aria-label', `Media ${index + 1}`);

        if (item.type === 'video') {
            // Video preview: shows the first frame of the animation ("what things look like")
            btn.appendChild(createVideoPreviewElement(item.src));
        } else {
            const img = document.createElement('img');
            img.src = item.thumb || item.src || '';
            img.alt = `${getProjectTitle(currentProjectIndex, getCurrentLang())} - media ${index + 1}`;
            img.loading = 'lazy';
            img.decoding = 'async';
            applyImageFallback(img, project.category);
            btn.appendChild(img);
        }

        // Video thumbnails get a small play symbol
        if (item.type === 'video') {
            const badge = document.createElement('span');
            badge.className = 'modal_thumb_badge';
            badge.textContent = '▶';
            btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
            currentMediaIndex = index;
            showMedia(index);
                        // Thumbnail click opens the lightbox directly with the enlarged media
            openLightbox();
            triggerMediaFeedback();
        });

        bar.appendChild(btn);
    });
}

/**
 * Shows a media item (image or video) in the given elements.
 * Shared logic for the main media viewer (showMedia) and the lightbox (syncLightbox),
 * so the video/image render logic lives in only ONE place.
 * @param {HTMLImageElement} imageEl - image element to fill
 * @param {HTMLVideoElement} videoEl - video element to fill
 * @param {{type:string}|undefined} item - media object (item.type === 'video' or image)
 * @param {Object} opts - Optionen
 * @param {boolean} opts.showControls - set/remove native controls on the video
 * @param {HTMLElement|null} opts.playBtn - play overlay button (shown/hidden)
 * @param {string} altText - alt text for images
 * @param {string} category - project category (for fallback images)
 */
function renderMediaItem(imageEl, videoEl, item, opts, altText, category) {
    // YouTube-Embed handling
    const stage = videoEl ? videoEl.parentElement : null;
    const ytEl = stage ? stage.querySelector('.modal_media_youtube, .modal_lightbox_youtube') : null;

    if (item.type === 'youtube') {
        // Hide image + video, show the YouTube facade
        imageEl.style.display = 'none';
        videoEl.style.display = 'none';
        if (opts.showControls) videoEl.removeAttribute('controls');
        if (opts.playBtn) opts.playBtn.style.display = 'none';
        if (ytEl) {
            const id = item.id || '';
            ytEl.innerHTML = '';
            if (id) {
                // Lightweight facade instead of an immediate player: thumbnail + play button
                // are shown and the iframe is only created on click (no parallel
                // preloading of heavy players). Optional start time in seconds
                // (item.start, e.g. for YouTube links with &t=95s).
                const startParam = Number.isFinite(item.start) && item.start > 0 ? `&start=${Math.floor(item.start)}` : '';
                const thumbSrc = item.thumb || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

                const facade = document.createElement('button');
                facade.type = 'button';
                facade.className = 'modal_youtube_facade';
                facade.setAttribute('aria-label', `Play ${altText || 'YouTube video'}`);

                const thumb = document.createElement('img');
                thumb.className = 'modal_youtube_thumb';
                thumb.src = thumbSrc;
                thumb.alt = altText || 'YouTube video';
                thumb.loading = 'lazy';
                thumb.decoding = 'async';

                const play = document.createElement('span');
                play.className = 'modal_youtube_play';
                play.textContent = '▶';
                play.setAttribute('aria-hidden', 'true');

                facade.appendChild(thumb);
                facade.appendChild(play);

                facade.addEventListener('click', () => {
                    const iframe = document.createElement('iframe');
                    iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1${startParam}`);
                    iframe.setAttribute('title', altText || 'YouTube video');
                    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.setAttribute('frameborder', '0');
                    iframe.classList.add('modal_youtube_frame');
                    ytEl.innerHTML = '';
                    ytEl.appendChild(iframe);
                });

                ytEl.appendChild(facade);
            }
            ytEl.style.display = 'block';
            ytEl.hidden = false;
        }
        return;
    }

    if (item.type === 'video') {
        imageEl.style.display = 'none';
        videoEl.style.display = 'block';
        // No static poster image anymore: the video shows its own first frame
        videoEl.removeAttribute('poster');
        videoEl.setAttribute('src', item.src);
        videoEl.preload = 'metadata';
        videoEl.load();
        // Render the first frame reliably (small time jump after loading)
        videoEl.addEventListener('loadeddata', () => {
            try { if (videoEl.paused) videoEl.currentTime = 0.001; } catch (e) { /* ignore */ }
        }, { once: true });
        if (opts.showControls) videoEl.setAttribute('controls', '');
        if (opts.playBtn) opts.playBtn.style.display = 'flex';
    } else {
        videoEl.style.display = 'none';
        if (opts.showControls) videoEl.removeAttribute('controls');
        videoEl.removeAttribute('src');
        videoEl.load();
        if (opts.playBtn) opts.playBtn.style.display = 'none';
        imageEl.src = item.src || '';
        // Native lazy-load control for the currently displayed image
        imageEl.loading = 'lazy';
        imageEl.decoding = 'async';
        applyImageFallback(imageEl, category);
        imageEl.alt = altText;
        imageEl.style.display = 'block';
    }
    if (ytEl) { ytEl.innerHTML = ''; ytEl.style.display = 'none'; ytEl.hidden = true; }
}

/**
 * Show the media item at position `index` in the main viewer
 */
function showMedia(index) {
    const project = currentProject;
    if (!project) return;
    const media = Array.isArray(project.media) ? project.media : [];
    if (!media.length) return;

    const item = media[index] || media[0];
    const imageEl = modalContainer.querySelector('.modal_media_image');
    const videoEl = modalContainer.querySelector('.modal_media_video');
    const playBtn = modalContainer.querySelector('.modal_media_play');

    // Stop the old video
    videoEl.pause();
    videoEl.removeAttribute('controls');

    renderMediaItem(imageEl, videoEl, item, { showControls: false, playBtn }, getProjectTitle(currentProjectIndex, getCurrentLang()), project.category);

    // Mark the active thumbnail (golden border)
    const thumbs = modalContainer.querySelectorAll('.modal_thumb');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });

        // Sync the lightbox content if open
    if (lightboxOpen) syncLightbox();
}

/**
 * Trigger a brief teal "water-like" glow + fade on the active media
 * whenever the selected image changes (viewer prev/next, thumbnails,
 * lightbox prev/next). One-shot CSS animation - no JS animation loop.
 */
function triggerMediaFeedback() {
    const targets = [];
    if (lightboxOverlay && lightboxOpen && currentProject) {
        const lbImg = lightboxOverlay.querySelector('.modal_lightbox_image');
        if (lbImg && lbImg.offsetParent !== null) targets.push(lbImg);
    } else if (modalContainer && currentProject) {
        const mainImg = modalContainer.querySelector('.modal_media_image');
        if (mainImg && mainImg.offsetParent !== null) targets.push(mainImg);
    }
    targets.forEach(img => {
        img.classList.add('media_nav_glow');
        img.addEventListener('animationend', () => {
            img.classList.remove('media_nav_glow');
        }, { once: true });
    });
}

/**
 * Trigger a brief blue/teal glow on the newly-selected project item when
 * switching projects (prev/next arrows, project-bar click, category tab).
 * Reuses the existing 0.3s transition of .modal_project_item - no JS loop.
 */
function triggerProjectFeedback() {
    if (!modalContainer) return;
    const activeItem = modalContainer.querySelector('.modal_project_item.active');
    if (!activeItem) return;
    activeItem.classList.add('project_nav_glow');
    if (activeItem._glowTimer) clearTimeout(activeItem._glowTimer);
    activeItem._glowTimer = setTimeout(() => {
        activeItem.classList.remove('project_nav_glow');
        activeItem._glowTimer = null;
    }, PROJECT_GLOW_MS);
}

/**
 * Play button: plays the current video
 */
function setupMediaEvents() {
    const playBtn = modalContainer.querySelector('.modal_media_play');
    const videoEl = modalContainer.querySelector('.modal_media_video');

    playBtn.addEventListener('click', () => {
        if (videoEl.style.display === 'none') return;
        videoEl.setAttribute('controls', '');
        const tryPlay = videoEl.play();
        if (tryPlay && tryPlay.then) {
            tryPlay.then(() => {
                playBtn.style.display = 'none';
            }).catch(() => {
                // Autoplay blocked etc. -> controls stay visible
            });
        }
    });

    videoEl.addEventListener('play', () => { playBtn.style.display = 'none'; });
    videoEl.addEventListener('pause', () => {
        if (!videoEl.ended) playBtn.style.display = 'flex';
    });
    videoEl.addEventListener('ended', () => {
        playBtn.style.display = 'flex';
        videoEl.removeAttribute('controls');
    });
}

/* LIGHTBOX FUeR DEN MEDIA-VIEWER (Vollbild) */

/**
 * Erstellt das Lightbox-Overlay als separates Element im body.
 * Wird unabhaengig vom Haupt-Modal positioniert (z-index 2000).
 */
function createLightbox() {
    if (lightboxOverlay) return; // bereits erstellt

    lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'modal_lightbox_overlay';
    lightboxOverlay.setAttribute('aria-hidden', 'true');

    lightboxOverlay.innerHTML = `
        <div class="modal_lightbox">
            <button class="modal_close_btn" aria-label="Close">✕</button>
            <button class="modal_lightbox_prev" aria-label="Previous media">‹</button>
            <button class="modal_lightbox_next" aria-label="Next media">›</button>
            <img class="modal_lightbox_image" src="" alt="" loading="lazy" decoding="async">
            <video class="modal_lightbox_video" playsinline preload="metadata" controls></video>
            <div class="modal_lightbox_youtube" hidden></div>
        </div>
    `;

    document.body.appendChild(lightboxOverlay);

    lightboxContainer = lightboxOverlay.querySelector('.modal_lightbox');
    lightboxImage = lightboxOverlay.querySelector('.modal_lightbox_image');
    lightboxVideo = lightboxOverlay.querySelector('.modal_lightbox_video');
}

/**
 * Verdrahtet die Lightbox-Events:
 * - Klick auf Media-Stage oeffnet die Lightbox
 * - Klick auf X-Button oder Overlay-Hintergrund schliesst sie
 * - Pfeile navigieren durch die Medien des aktuellen Projekts
 */
function setupLightbox() {
    const mediaStage = modalContainer.querySelector('.modal_media_stage');
    mediaStage.addEventListener('click', (e) => {
        // Play-Button-Klick nicht als Lightbox-Oeffnung interpretieren
        if (e.target.closest('.modal_media_play')) return;
        openLightbox();
    });

    // X-Button schliesst die Lightbox
    const closeBtn = lightboxOverlay.querySelector('.modal_close_btn');
    closeBtn.addEventListener('click', closeLightbox);

    // Klick auf Overlay-Hintergrund schliesst die Lightbox
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    // Pfeile navigieren durch die Bilder des aktuellen Projekts
    const prevBtn = lightboxOverlay.querySelector('.modal_lightbox_prev');
    const nextBtn = lightboxOverlay.querySelector('.modal_lightbox_next');
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMedia(-1);
    });
    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateMedia(1);
    });
}

/**
 * Oeffnet die Lightbox und zeigt das aktuell ausgewaehlte Medium.
 */
function openLightbox() {
    if (!lightboxOverlay) return;

    const project = currentProject;
    if (!project || !Array.isArray(project.media) || project.media.length === 0) return;

    syncLightbox();
    // Laufende Close-Animation abbrechen + alte Klassen entfernen
    if (lightboxCloseTimer) {
        clearTimeout(lightboxCloseTimer);
        lightboxCloseTimer = null;
    }
    if (lightboxContainer) lightboxContainer.classList.remove('water_close');
    const lbCloseBtn = lightboxOverlay.querySelector('.modal_close_btn');
    if (lbCloseBtn) lbCloseBtn.classList.remove('water_effect');
    lightboxOverlay.classList.add('active');
    lightboxOverlay.setAttribute('aria-hidden', 'false');
    lightboxOpen = true;
}

/**
 * Schliesst die Lightbox und pausiert das Video.
 */
function closeLightbox() {
    if (!lightboxOverlay) return;
    if (!lightboxOpen) return; // bereits geschlossen / Close-Animation laeuft

    lightboxOpen = false;

    // Video pausieren, ABER das Bild fuer die Close-Animation sichtbar lassen
    if (lightboxVideo) {
        lightboxVideo.pause();
    }

    // Trigger water_distort_close SVG animation (gleicher Ablauf wie Modal-Close)
    const closeBtn = lightboxOverlay.querySelector('.modal_close_btn');
    restartWaterCloseAnimation(closeBtn);

    // Wasser-Close-Animation auf der Lightbox starten
    if (lightboxContainer) lightboxContainer.classList.add('water_close');

    // Nach der Animation ausblenden (Dauer identisch zum Modal: WATER_ANIMATION_MS)
    lightboxCloseTimer = setTimeout(() => {
        lightboxCloseTimer = null;
        if (lightboxContainer) lightboxContainer.classList.remove('water_close');
        if (closeBtn) closeBtn.classList.remove('water_effect');
        lightboxOverlay.classList.remove('active');
        lightboxOverlay.setAttribute('aria-hidden', 'true');
        if (lightboxVideo) {
            lightboxVideo.removeAttribute('src');
            lightboxVideo.load();
        }
    }, WATER_ANIMATION_MS);
}

/**
 * Aktualisiert die Lightbox-Ansicht auf das aktuell ausgewaehlte Medium
 * (currentMediaIndex). Wird nach showMedia aufgerufen, wenn die Lightbox offen ist.
 */
function syncLightbox() {
    if (!lightboxImage || !lightboxVideo) return;

    const project = currentProject;
    if (!project) return;
    const media = Array.isArray(project.media) ? project.media : [];
    if (!media.length) return;

    const item = media[currentMediaIndex] || media[0];

    lightboxVideo.pause();
    renderMediaItem(lightboxImage, lightboxVideo, item, { showControls: true, playBtn: null }, getProjectTitle(currentProjectIndex, getCurrentLang()), project.category);
}


/* ==========================================================================
   FILE: js/modules/modal.js
   DESCRIPTION: Project modal: open/close water animations, media viewer, lightbox, thumbnails, and keyboard navigation.
   ========================================================================== */

import { getCurrentLang } from './language.js';
import { LARGE_BREAKPOINT_PX, XLARGE_BREAKPOINT_PX, FOUR_K_BREAKPOINT_PX, CANVAS_BACKING_MAX_WIDTH, MOBILE_BREAKPOINT } from '../constants/ui.js';
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
} from '../constants/projects.js?v=11';
import { skillIconHtml } from '../constants/skills.js?v=4';
import { initModalShader } from './modal_shader.js';

let modalOverlay = null;
let modalContainer = null;
let modalShader = null;
let currentProject = null;
let projectsList = [];
let currentProjectIndex = 0;
let currentMediaIndex = 0;


let lightboxOverlay = null;
let lightboxContainer = null;
let lightboxImage = null;
let lightboxVideo = null;
let lightboxOpen = false;
let lightboxCloseTimer = null;


const WATER_ANIMATION_MS = 1000;      
const PROJECT_GLOW_MS = 420;          



const MODAL_SIZE_PRESETS = [
    { minWidth: FOUR_K_BREAKPOINT_PX, width: 1800, height: 1400 },
    { minWidth: CANVAS_BACKING_MAX_WIDTH, width: 1400, height: 1100 },
    { minWidth: LARGE_BREAKPOINT_PX, width: 1100, height: 900 },
];
const MODAL_DEFAULT_SIZE = { minWidth: 0, width: 900, height: 800 };
const MODAL_VIEWPORT_MARGIN_X = 60;   
const MODAL_VIEWPORT_MARGIN_Y = 80;   




const MODAL_SIDEBAR_RESERVE_PX = 56;
const MOBILE_MODAL_BREAKPOINT_PX = MOBILE_BREAKPOINT;


export function initModal(projects) {
    createModalElements();
    attachEventListeners(projects);
}


function createModalElements() {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'project_modal_overlay';

    modalContainer = document.createElement('div');
    modalContainer.className = 'project_modal';

    modalContainer.innerHTML = `
        <button class="modal_close_btn" aria-label="Close">✕</button>

        <div class="modal_content">
            <div class="modal_cat_tabs" role="tablist" aria-label="Project categories"></div>

            
            <div class="modal_project_bar_label">Projects in this category</div>

            
            <div class="modal_project_bar" role="group" aria-label="Projects in category"></div>

            <div class="modal_project_header">
                <h2 class="modal_project_title"></h2>
                <div class="modal_project_switch">
                    <button class="modal_project_prev" aria-label="Previous project" title="">‹</button>
                    <span class="modal_project_switch_label"></span>
                    <button class="modal_project_next" aria-label="Next project" title="">›</button>
                </div>
            </div>

            
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

            
            <div class="modal_thumb_bar"></div>

            
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

            
            <div class="modal_skills_section">
                <h3 class="modal_skills_title">Tools & Skills used</h3>
                <div class="modal_skills_grid"></div>
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    
    setupMediaEvents();

    
    
    bindMediaDragGesture(
        modalContainer.querySelector('.modal_media_stage'),
        () => navigateMedia(1),
        () => navigateMedia(-1)
    );

    
    createLightbox();
    setupLightbox();

    
    modalShader = initModalShader(modalContainer);
}


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

    
    const catTabs = modalContainer.querySelector('.modal_cat_tabs');
    catTabs.addEventListener('click', (e) => {
        if (e.target.closest('.modal_cat_prev')) { navigateCategory(-1); return; }
        if (e.target.closest('.modal_cat_next')) { navigateCategory(1); return; }
        const tab = e.target.closest('.modal_cat_tab');
        if (tab && tab.dataset.category) {
            switchCategory(tab.dataset.category);
        }
    });

    
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
            
            if (lightboxOpen) { closeLightbox(); return; }
            closePopup();
            return;
        }
        
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigateCategory(e.key === 'ArrowLeft' ? -1 : 1);
            return;
        }
        
        if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); navigateProject(-1); return; }
        if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); navigateProject(1); return; }
        if (e.key === 'ArrowLeft') navigateMedia(-1);
        if (e.key === 'ArrowRight') navigateMedia(1);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePopup();
    });

    
    
    document.addEventListener('languageChanged', () => {
        if (currentProject) {
            populateModal(currentProject);
        }
    });
}


function navigateMedia(direction) {
    if (!currentProject || !Array.isArray(currentProject.media) || currentProject.media.length === 0) return;
    const total = currentProject.media.length;
        currentMediaIndex = (currentMediaIndex + direction + total) % total;
    showMedia(currentMediaIndex);
    triggerMediaFeedback();
}


function switchCategory(category) {
    const target = getFirstProjectOfCategory(category);
    if (target === null || target === undefined) return;
    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;
        
    populateModal(currentProject);
    resetModalScroll();
    triggerProjectFeedback();
}


function navigateProject(direction) {
    if (!currentProject) return;
    
    const dirName = direction < 0 ? 'prev' : 'next';
    const target = getSiblingProjectIndex(currentProjectIndex, dirName);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

        
    populateModal(currentProject);
    resetModalScroll();
    triggerProjectFeedback();
}


function navigateCategory(direction) {
    if (!currentProject) return;
    
    const dirName = direction < 0 ? 'prev' : 'next';
    const target = getAdjacentCategoryProject(currentProjectIndex, dirName);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

    populateModal(currentProject);
    resetModalScroll();
    
    triggerProjectFeedback();
}


function buildCategoryTabs() {
    const tabsEl = modalContainer.querySelector('.modal_cat_tabs');
    if (!tabsEl) return;
    const lang = getCurrentLang();

    tabsEl.innerHTML = '';

    
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

    
    const catNextBtn = document.createElement('button');
    catNextBtn.className = 'modal_cat_next';
    catNextBtn.textContent = '»';
    catNextBtn.setAttribute('aria-label', 'Next category');
    tabsEl.appendChild(catNextBtn);
}


function updateProjectNav() {
    
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


function createVideoPreviewElement(src) {
    const vid = document.createElement('video');
    vid.src = src || '';
    vid.muted = true;
    vid.preload = 'metadata';
    vid.playsInline = true;
    vid.setAttribute('playsinline', '');
    vid.setAttribute('aria-hidden', 'true');
    
    vid.addEventListener('loadeddata', () => {
        try { vid.currentTime = 0.001; } catch (e) {  }
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


function switchToProjectIndex(index) {
    if (!projectsList[index]) return;
    currentProjectIndex = index;
        currentProject = projectsList[index];
    if (!currentProject) return;
    populateModal(currentProject);
    resetModalScroll();
    triggerProjectFeedback();
}


function resetModalScroll() {
    const content = modalContainer ? modalContainer.querySelector('.modal_content') : null;
    if (content) content.scrollTop = 0;
}


export function showPopupAtCard(project, card) {
    currentProjectIndex = projectsList.findIndex(p => p === project);
    if (currentProjectIndex === -1) currentProjectIndex = 0;
    currentProject = project;

    
    
    
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const sizePreset = MODAL_SIZE_PRESETS.find(p => vw >= p.minWidth) || MODAL_DEFAULT_SIZE;
    const maxModalW = sizePreset.width;
    const maxModalH = sizePreset.height;
    const sidebarReserve = vw <= MOBILE_MODAL_BREAKPOINT_PX ? MODAL_SIDEBAR_RESERVE_PX : 0;
    const modalWidth = Math.min(maxModalW, vw - MODAL_VIEWPORT_MARGIN_X - sidebarReserve);
    const modalHeight = Math.min(maxModalH, window.innerHeight - MODAL_VIEWPORT_MARGIN_Y);
    const left = Math.max((vw - modalWidth) / 2, 12);

    
    
    const headerEl = document.querySelector('.header');
    const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
    const centerTop = (window.innerHeight - modalHeight) / 2;
    const top = Math.max(headerBottom + 14, centerTop);

    
    modalContainer.style.position = 'fixed';
    modalContainer.style.left = `${left}px`;
    modalContainer.style.top = `${top}px`;
    modalContainer.style.width = `${modalWidth}px`;
    modalContainer.style.maxHeight = `${modalHeight}px`;

    
    modalContainer.classList.remove('water_emerge', 'fade_complete');
    void modalContainer.offsetWidth;

    
    modalOverlay.style.display = 'block';
    modalOverlay.style.opacity = '0';
    void modalOverlay.offsetHeight;
    modalOverlay.style.transition = 'opacity 0.3s ease';
    modalOverlay.style.opacity = '1';

    
    modalContainer.style.display = 'block';
    modalContainer.style.opacity = '1';
    modalContainer.style.transform = 'scale(1)';

    
    const svgFilter = document.getElementById('water_emerge');
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

    
    modalContainer.classList.add('water_emerge');

    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
    }
    modalContainer._emergeTimer = setTimeout(() => {
        
        modalContainer.classList.remove('water_emerge');
    }, WATER_ANIMATION_MS); 

    
    
    populateModal(project);

    
    
    
    lockBodyScroll();
    
    resetModalScroll();
}


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


function lockBodyScroll() {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbarWidth > 0 ? `${scrollbarWidth}px` : '';
    document.body.classList.add('modal-open');
    
    
    
    delete document.body.dataset.modalResumeAt;
}


function unlockBodyScroll() {
    
    
    if (document.body.classList.contains('modal-open')) {
        document.body.dataset.modalResumeAt = String(performance.now());
    }
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    document.body.classList.remove('modal-open');
}


function closePopup(immediate = false) {
    if (!currentProject) return;

    
    if (lightboxOpen) closeLightbox();

    if (modalContainer._emergeTimer) {
        clearTimeout(modalContainer._emergeTimer);
        modalContainer._emergeTimer = null;
    }

    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }

    
    
    
    stopActiveModalVideos({ unloadPlayers: false });

    modalContainer.classList.remove('water_emerge', 'fade_complete');
    const modalContent = modalContainer.querySelector('.modal_content');
    if (modalContent) {
        modalContent.style.filter = '';
        modalContent.style.webkitFilter = '';
    }

    const closeBtn = modalContainer.querySelector('.modal_close_btn');

    
    
    if (modalShader) {
        modalShader.stop();
    }

    if (immediate) {
        
        
        unlockBodyScroll();
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('water_close');
        if (closeBtn) {
            closeBtn.classList.remove('water_effect');
        }
        currentProject = null;
        return;
    }

    
    restartWaterCloseAnimation(closeBtn);

    
    modalContainer.classList.add('water_close');

    
    
    modalOverlay.style.transition = 'opacity 0.35s ease';
    modalOverlay.style.opacity = '0';

    
    
    
    
    
    
    
    
    setTimeout(() => {
        requestAnimationFrame(unlockBodyScroll);
        setTimeout(unlockBodyScroll, 50);
    }, 400);

    
    setTimeout(() => {
        
        
        
        modalOverlay.style.display = 'none';
        modalContainer.style.display = 'none';
        modalContainer.classList.remove('water_close');
        if (closeBtn) {
            closeBtn.classList.remove('water_effect');
        }
        currentProject = null;
        stopActiveModalVideos({ unloadPlayers: false });
    }, WATER_ANIMATION_MS);
}


export function closeProjectModal(options = {}) {
    closePopup(Boolean(options.immediate));
}


export function isProjectModalOpen() {
    return Boolean(currentProject);
}


function populateModal(project) {
    const lang = getCurrentLang();

    
    if (lightboxOpen) closeLightbox();

    
    const bgClasses = ['modal_bg_abyss', 'modal_bg_teal', 'modal_bg_ocean', 'modal_bg_bio', 'modal_bg_amber', 'modal_bg_rose'];
    modalContainer.classList.remove(...bgClasses);
    const scheme = currentProject ? getCategorySchemeIndex(currentProject.category) : 0;
    if (scheme >= 0 && scheme < bgClasses.length) {
        modalContainer.classList.add(bgClasses[scheme]);
    }
    
    if (modalShader) {
        modalShader.start(scheme);
    }

    
    const titleEl = modalContainer.querySelector('.modal_project_title');
    titleEl.textContent = getProjectTitle(currentProjectIndex, lang);

    
    const barLabelEl = modalContainer.querySelector('.modal_project_bar_label');
    if (barLabelEl) barLabelEl.textContent = lang === 'de' ? 'Projekte in dieser Kategorie' : 'Projects in this category';

    
    buildProjectBar();

    
    const descriptionEl = modalContainer.querySelector('.modal_project_description');
    descriptionEl.textContent = getProjectDescription(currentProjectIndex, lang);

    
    const gameConceptEl = modalContainer.querySelector('.modal_game_concept');
    const gameConceptTextEl = modalContainer.querySelector('.modal_game_concept_text');
    const conceptTitleEl = modalContainer.querySelector('.modal_game_concept_title');
    if (conceptTitleEl) conceptTitleEl.textContent = lang === 'de' ? 'Spielkonzept' : 'Game Concept';
    const gameConcept = getProjectGameConcept(currentProjectIndex, lang);
    gameConceptTextEl.textContent = gameConcept;
    gameConceptEl.hidden = !gameConcept;

    
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

    
    const contributionTitleEl = modalContainer.querySelector('.modal_contribution_title');
    if (contributionTitleEl) contributionTitleEl.textContent = lang === 'de' ? 'Mein Beitrag' : 'My Contribution';
    const contributionList = modalContainer.querySelector('.modal_contribution_list');
    const contributions = getProjectContribution(currentProjectIndex, lang);
    contributionList.innerHTML = '';
    
    
    
    
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

    
    const skillsTitleEl = modalContainer.querySelector('.modal_skills_title');
    if (skillsTitleEl) skillsTitleEl.textContent = lang === 'de' ? 'Tools & Skills' : 'Tools & Skills used';
    const skillsGridEl = modalContainer.querySelector('.modal_skills_grid');
    skillsGridEl.innerHTML = '';

    
    
    const projectSkills = getProjectSkills(currentProjectIndex);
    projectSkills.forEach((skill) => {
        const tag = document.createElement('span');
        tag.className = 'modal_skill_tag';
        tag.setAttribute('data-skill-id', skill.id);
        tag.innerHTML = `${skillIconHtml(skill)} ${skill.name}`;
        skillsGridEl.appendChild(tag);
    });

    
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

    
    
    
    stopActiveModalVideos();
    currentMediaIndex = 0;
    buildThumbnails(project);
    showMedia(0);

    
    updateProjectNav();

    
    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }
}


function buildThumbnails(project) {
    const bar = modalContainer.querySelector('.modal_thumb_bar');
    bar.innerHTML = '';

    const media = Array.isArray(project.media) ? project.media : [];
    media.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'modal_thumb';
        btn.setAttribute('aria-label', `Media ${index + 1}`);

        if (item.type === 'video') {
            
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

        
        if (item.type === 'video') {
            const badge = document.createElement('span');
            badge.className = 'modal_thumb_badge';
            badge.textContent = '▶';
            btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
            currentMediaIndex = index;
            showMedia(index);
                        
            openLightbox();
            triggerMediaFeedback();
        });

        bar.appendChild(btn);
    });
}


function stopActiveModalVideos({ unloadPlayers = true } = {}) {
    const scopes = [modalContainer, lightboxOverlay];
    scopes.forEach((scope) => {
        if (!scope) return;
        
        scope.querySelectorAll('video').forEach((vid) => {
            if (!vid.paused) {
                try { vid.pause(); } catch (err) {  }
            }
        });
        
        
        
        
        scope.querySelectorAll('.modal_media_youtube, .modal_lightbox_youtube').forEach((yt) => {
            if (yt.querySelector('iframe')) yt.innerHTML = '';
        });
    });
    
    
    
    if (unloadPlayers) {
        const players = [
            modalContainer ? modalContainer.querySelector('.modal_media_video') : null,
            lightboxOverlay ? lightboxOverlay.querySelector('.modal_lightbox_video') : null
        ];
        players.forEach((vid) => {
            if (!vid) return;
            try { vid.pause(); } catch (err) {  }
            vid.removeAttribute('src');
            try { vid.load(); } catch (err) {  }
        });
    }
}


function renderMediaItem(imageEl, videoEl, item, opts, altText, category) {
    
    const stage = videoEl ? videoEl.parentElement : null;
    const ytEl = stage ? stage.querySelector('.modal_media_youtube, .modal_lightbox_youtube') : null;

    if (item.type === 'youtube') {
        
        
        if (videoEl && !videoEl.paused) {
            try { videoEl.pause(); } catch (err) {  }
        }
        
        imageEl.style.display = 'none';
        videoEl.style.display = 'none';
        if (opts.showControls) videoEl.removeAttribute('controls');
        if (opts.playBtn) opts.playBtn.style.display = 'none';
        if (ytEl) {
            const id = item.id || '';
            ytEl.innerHTML = '';
            if (id) {
                
                
                
                
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
        
        videoEl.removeAttribute('poster');
        videoEl.setAttribute('src', item.src);
        videoEl.preload = 'metadata';
        videoEl.load();
        
        videoEl.addEventListener('loadeddata', () => {
            try { if (videoEl.paused) videoEl.currentTime = 0.001; } catch (e) {  }
        }, { once: true });
        
        videoEl.setAttribute('controls', '');
        if (opts.playBtn) opts.playBtn.style.display = 'flex';
    } else {
        videoEl.style.display = 'none';
        if (opts.showControls) videoEl.removeAttribute('controls');
        videoEl.removeAttribute('src');
        videoEl.load();
        if (opts.playBtn) opts.playBtn.style.display = 'none';
        imageEl.src = item.src || '';
        
        imageEl.loading = 'lazy';
        imageEl.decoding = 'async';
        applyImageFallback(imageEl, category);
        imageEl.alt = altText;
        imageEl.style.display = 'block';
    }
    if (ytEl) { ytEl.innerHTML = ''; ytEl.style.display = 'none'; ytEl.hidden = true; }
}


function showMedia(index) {
    const project = currentProject;
    if (!project) return;
    const media = Array.isArray(project.media) ? project.media : [];
    if (!media.length) return;

    const item = media[index] || media[0];
    const imageEl = modalContainer.querySelector('.modal_media_image');
    const videoEl = modalContainer.querySelector('.modal_media_video');
    const playBtn = modalContainer.querySelector('.modal_media_play');

    videoEl.pause();

    renderMediaItem(imageEl, videoEl, item, { showControls: false, playBtn }, getProjectTitle(currentProjectIndex, getCurrentLang()), project.category);

    
    const thumbs = modalContainer.querySelectorAll('.modal_thumb');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });

        
    if (lightboxOpen) syncLightbox();
}


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


function setupMediaEvents() {
    const playBtn = modalContainer.querySelector('.modal_media_play');
    const videoEl = modalContainer.querySelector('.modal_media_video');

    playBtn.addEventListener('click', () => {
        if (videoEl.style.display === 'none') return;
        const tryPlay = videoEl.play();
        if (tryPlay && tryPlay.then) {
            tryPlay.then(() => {
                playBtn.style.display = 'none';
            }).catch(() => {
                
            });
        }
    });

    videoEl.addEventListener('play', () => { playBtn.style.display = 'none'; });
    
    
    
    videoEl.addEventListener('pause', () => {
        if (!videoEl.ended) playBtn.style.display = 'flex';
    });
    videoEl.addEventListener('ended', () => {
        playBtn.style.display = 'flex';
    });
}


function bindMediaDragGesture(el, onNext, onPrev) {
    if (!el) return;

        const DRAG_START_DISTANCE = 14;  
    const SWIPE_THRESHOLD = 55;      

    
    const FOLLOW_DURING_DRAG = false;
    const WHEEL_THRESHOLD = 30;      
    const WHEEL_COOLDOWN_MS = 700;

    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let lastDX = 0;
    let dragging = false;
    let suppressClick = false;

    function getMedia() {
        return el.querySelector('img, video');
    }

    function resetTransform() {
        const media = getMedia();
        if (media) media.style.transform = '';
        el.classList.remove('is_dragging');
    }

    el.addEventListener('dragstart', (e) => {
        
        e.preventDefault();
    });

    el.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (!e.isPrimary) return;
        
        
        
        
        
        
        
        
        const startEl = e.target && e.target.closest
            ? e.target.closest('button, a, input, select, textarea, [role="button"], video')
            : null;
        if (startEl) return;
        pointerId = e.pointerId;
        startX = e.clientX;
        startY = e.clientY;
        lastDX = 0;
        dragging = false;
        suppressClick = false;
        try { el.setPointerCapture(e.pointerId); } catch (err) {  }
    }, true);

    el.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pointerId) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (!dragging) {
            
            
            if (Math.abs(dx) < DRAG_START_DISTANCE) return;
            if (Math.abs(dx) < Math.abs(dy) * 1.2) return;
            dragging = true;
            el.classList.add('is_dragging');
        }

        lastDX = dx;
        if (FOLLOW_DURING_DRAG) {
            const media = getMedia();
            if (media) {
                
                media.style.transform = `translate3d(${dx}px, 0, 0)`;
            }
        }
        
        
        
    }, { passive: true });

    function endDrag(e) {
        if (e && e.pointerId !== undefined && e.pointerId !== pointerId) return;
        const wasDragging = dragging;
        dragging = false;
        pointerId = null;

        resetTransform();

        if (!wasDragging) return;

        const dx = lastDX;
        if (Math.abs(dx) >= SWIPE_THRESHOLD) {
            if (dx < 0) onNext(); else onPrev();
            suppressClick = true;
        }
    }

    el.addEventListener('pointerup', endDrag, true);
    el.addEventListener('pointercancel', endDrag, true);
    el.addEventListener('lostpointercapture', () => {
        pointerId = null;
        if (dragging) { dragging = false; resetTransform(); }
    });

    
    
    el.addEventListener('click', (e) => {
        if (suppressClick) {
            suppressClick = false;
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    
    let lastWheelTime = 0;
    el.addEventListener('wheel', (e) => {
        const dx = e.deltaX;
        const dy = e.deltaY;
        if (Math.abs(dx) < WHEEL_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
        const now = Date.now();
        if (now - lastWheelTime < WHEEL_COOLDOWN_MS) return;
        lastWheelTime = now;
        if (dx < 0) onNext(); else onPrev();
    }, { passive: true });
}




function createLightbox() {
    if (lightboxOverlay) return; 

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


function setupLightbox() {
    const mediaStage = modalContainer.querySelector('.modal_media_stage');
    mediaStage.addEventListener('click', (e) => {
        
        if (e.target.closest('.modal_media_play, video')) return;
        openLightbox();
    });

    
    const closeBtn = lightboxOverlay.querySelector('.modal_close_btn');
    closeBtn.addEventListener('click', closeLightbox);

    
    lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === lightboxOverlay) closeLightbox();
    });

    
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

    
    bindMediaDragGesture(
        lightboxContainer,
        () => navigateMedia(1),
        () => navigateMedia(-1)
    );
}


function openLightbox() {
    if (!lightboxOverlay) return;

    
    
    
    stopActiveModalVideos({ unloadPlayers: false });

    const project = currentProject;
    if (!project || !Array.isArray(project.media) || project.media.length === 0) return;

    syncLightbox();
    
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


function closeLightbox() {
    if (!lightboxOverlay) return;
    if (!lightboxOpen) return; 

    lightboxOpen = false;

    
    if (lightboxVideo) {
        lightboxVideo.pause();
    }
    
    
    const lbYt = lightboxOverlay.querySelector('.modal_lightbox_youtube');
    if (lbYt && lbYt.querySelector('iframe')) lbYt.innerHTML = '';

    
    const closeBtn = lightboxOverlay.querySelector('.modal_close_btn');
    restartWaterCloseAnimation(closeBtn);

    
    if (lightboxContainer) lightboxContainer.classList.add('water_close');

    
    lightboxCloseTimer = setTimeout(() => {
        lightboxCloseTimer = null;
        if (lightboxContainer) lightboxContainer.classList.remove('water_close');
        if (closeBtn) closeBtn.classList.remove('water_effect');
        lightboxOverlay.classList.remove('active');
        lightboxOverlay.setAttribute('aria-hidden', 'true');
        if (lightboxVideo) {
            
            
            lightboxVideo.removeAttribute('src');
        }
    }, WATER_ANIMATION_MS);
}


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


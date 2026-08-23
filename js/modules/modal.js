/* ========================================= */
/* PROJECT MODAL MODULE - MEDIA GALLERY        */
/*                                             */
/* Neuer Modal-Inhalt: Media-Viewer,           */
/* Thumbnail-Leiste, Zwei-Spalten-Bereich,     */
/* Tools & Skills. Modal-Fenster/Shader/       */
/* Animation bleiben unveraendert.             */
/* ========================================= */

import { getCurrentLang } from './language.js';
import {
    getProjectSubtitle,
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
} from '../constants/projects.js?v=5';
import { initModalShader } from './modal_shader.js';

let modalOverlay = null;
let modalContainer = null;
let modalShader = null;
let currentProject = null;
let projectsList = [];
let currentProjectIndex = 0;
let currentMediaIndex = 0;

// Lightbox state (Vollbild-Ansicht des Media-Viewers)
let lightboxOverlay = null;
let lightboxContainer = null;
let lightboxImage = null;
let lightboxVideo = null;
let lightboxOpen = false;
let lightboxCloseTimer = null;

/* ---- Timing / Animation constants ---- */
const WATER_ANIMATION_MS = 1000;      // Dauer der SVG Wasser-Morph-Animation (0.8s + Buffer; matcht --water-close-duration in modal.css)
const PROJECT_GLOW_MS = 420;          // Anzeige-Dauer des Projekt-Glow-Feedbacks (matcht --media-nav-glow-duration in modal.css)

/* ---- Viewport-responsive Modal-Groessen ---- */
// Groessenschema pro grossem Breakpoint (2056px+). Kleinere Viewports fallen auf den Default.
const MODAL_SIZE_PRESETS = [
    { minWidth: 3840, width: 1800, height: 1400 },
    { minWidth: 2560, width: 1400, height: 1100 },
    { minWidth: 2056, width: 1100, height: 900 },
];
const MODAL_DEFAULT_SIZE = { minWidth: 0, width: 900, height: 800 };
const MODAL_VIEWPORT_MARGIN_X = 60;   // Abstand des Modals zum Viewport-Rand (horizontal)
const MODAL_VIEWPORT_MARGIN_Y = 80;   // Abstand des Modals zum Viewport-Rand (vertikal)

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

            <!-- LABEL ÜBER DER PROJEKT-AUSWAHL-LEISTE -->
            <div class="modal_project_bar_label">Projects in this category</div>

            <!-- PROJEKT-AUSWAHL-LEISTE (Ebene 2: Projekte innerhalb der aktuellen Kategorie) -->
            <div class="modal_project_bar" role="group" aria-label="Projects in category"></div>

            <div class="modal_project_header">
                <h2 class="modal_project_title"></h2>
                <span class="modal_project_category"></span>
                <p class="modal_project_subtitle"></p>
                <div class="modal_project_switch">
                    <button class="modal_project_prev" aria-label="Previous project" title="">‹</button>
                    <span class="modal_project_switch_label"></span>
                    <button class="modal_project_next" aria-label="Next project" title="">›</button>
                </div>
            </div>

            <!-- HAUPT-MEDIA-VIEWER -->
            <div class="modal_media_viewer">
                <div class="modal_media_stage">
                    <img class="modal_media_image" src="" alt="">
                    <video class="modal_media_video" playsinline preload="metadata"></video>
                    <button class="modal_media_play" aria-label="Play video">▶</button>
                </div>
                <button class="modal_media_prev" aria-label="Previous media">‹</button>
                <button class="modal_media_next" aria-label="Next media">›</button>
            </div>

            <!-- THUMBNAIL-LEISTE -->
            <div class="modal_thumb_bar"></div>

            <!-- ZWEI-SPALTEN-BEREICH -->
            <div class="modal_info_grid">
                <div class="modal_description_col">
                    <p class="modal_project_description"></p>
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

    // Media-Events (Play-Button/Video) einmalig verdrahten
    setupMediaEvents();

    // Lightbox für den großen Media-Viewer (Vollbild) erstellen und verdrahten
    createLightbox();
    setupLightbox();

    // Initialize voronoi shader background (unveraendert)
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

    // Kategorie-Reiter (Delegation: Reiter werden dynamisch neu gebaut)
    const catTabs = modalContainer.querySelector('.modal_cat_tabs');
    catTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.modal_cat_tab');
        if (tab && tab.dataset.category) {
            switchCategory(tab.dataset.category);
        }
    });

    // Projekt-Auswahl-Leiste (Ebene 2) - Klick-Delegation
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
            // Lightbox schließen, wenn geöffnet – Modal bleibt offen
            if (lightboxOpen) { closeLightbox(); return; }
            closePopup();
            return;
        }
        // Ctrl+Pfeil -> zwischen KATEGORIEN wechseln
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigateCategory(e.key === 'ArrowLeft' ? -1 : 1);
            return;
        }
        // Alt+Pfeil -> zwischen Projekten derselben Kategorie wechseln
        if (e.key === 'ArrowLeft' && e.altKey) { e.preventDefault(); navigateProject(-1); return; }
        if (e.key === 'ArrowRight' && e.altKey) { e.preventDefault(); navigateProject(1); return; }
        if (e.key === 'ArrowLeft') navigateMedia(-1);
        if (e.key === 'ArrowRight') navigateMedia(1);
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closePopup();
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
 * Zwischen Projekten DERSELBEN Kategorie wechseln.
 * Setzt die Bild-Navigation automatisch auf das erste Medium zurueck.
 * Gibt es in der Kategorie nur ein Projekt, passiert nichts
 * (die Pfeile sind dann deaktiviert/grau).
 */
function switchCategory(category) {
    const target = getFirstProjectOfCategory(category);
    if (target === null || target === undefined) return;
    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;
        // populateModal setzt Shader-Farbe, Media auf 0 und baut alles neu
    populateModal(currentProject);
    triggerProjectFeedback();
}

/**
 * Zwischen Projekten DERSELBEN Kategorie wechseln.
 * Setzt die Bild-Navigation automatisch auf das erste Medium zurueck.
 */
function navigateProject(direction) {
    if (!currentProject) return;
    const target = getSiblingProjectIndex(currentProjectIndex, direction);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

        // Fuehrt currentMediaIndex auf 0 zurueck + rebuilds alles (inkl. Shader-Farbe)
    populateModal(currentProject);
    triggerProjectFeedback();
}

/**
 * Zwischen den KATEGORIEN wechseln (z.B. Game Dev -> Sound).
 * Wechselt zum ersten Projekt der angrenzenden Kategorie.
 */
function navigateCategory(direction) {
    if (!currentProject) return;
    const target = getAdjacentCategoryProject(currentProjectIndex, direction);
    if (target === null || target === undefined) return;

    currentProjectIndex = target;
    currentProject = projectsList[target];
    if (!currentProject) return;

    populateModal(currentProject);
    // Auch beim Kategoriewechsel den neu aktivierten Projekt-Tab hervorheben
    triggerProjectFeedback();
}

/**
 * Baut die Kategorie-Reiter (Tabs) ins Modal.
 * Der aktive Reiter markiert die aktuell geoeffnete Kategorie.
 */
function buildCategoryTabs() {
    const tabsEl = modalContainer.querySelector('.modal_cat_tabs');
    if (!tabsEl) return;
    const lang = getCurrentLang();

    tabsEl.innerHTML = '';
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
}

/**
 * Aktualisiert Kategorie-Reiter + Projekt-Umschalter.
 * Der Projekt-Umschalter wird nur gezeigt, wenn die Kategorie
 * MEHRERE Projekte hat (sonst versteckt, keine verwirrenden Pfeile).
 */
function updateProjectNav() {
    // Reiter neu aufbauen (aktiver = aktuelle Kategorie)
    buildCategoryTabs();

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
        prevBtn.title = prevIdx >= 0 && projectsList[prevIdx] ? projectsList[prevIdx].title : '';
        nextBtn.title = nextIdx >= 0 && projectsList[nextIdx] ? projectsList[nextIdx].title : '';
        prevBtn.disabled = !hasSiblings;
        nextBtn.disabled = !hasSiblings;
        prevBtn.classList.toggle('disabled', !hasSiblings);
        nextBtn.classList.toggle('disabled', !hasSiblings);
        if (labelEl) labelEl.textContent = hasSiblings ? `${pos + 1} / ${indices.length}` : '';
    }
}

/**

/**
 * Baut die Projekt-Auswahl-Leiste (Ebene 2) fuer die aktuelle Kategorie.
 * Zeigt alle Projekte der Kategorie als anklickbare Karten mit Cover + Titel.
 * Das aktuell ausgewaehlte Projekt erhaelt die 'active'-Klasse.
 */
function buildProjectBar() {
    const bar = modalContainer.querySelector('.modal_project_bar');
    if (!bar) return;
    bar.innerHTML = '';
    if (!currentProject) return;

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

        const img = document.createElement('img');
        const media = Array.isArray(project.media) ? project.media : [];
        img.src = project.cover || (media[0] && (media[0].thumb || media[0].src)) || '';
        img.alt = project.title || '';
        img.loading = 'lazy';
        applyImageFallback(img, project.category);
        item.appendChild(img);

        const label = document.createElement('span');
        label.className = 'modal_project_item_label';
        label.textContent = project.title || '';
        item.appendChild(label);

        bar.appendChild(item);
    });
}

/**
 * Wechselt zu einem beliebigen Projekt (via Projekt-Auswahl-Leiste o.ae.).
 * Setzt currentProjectIndex + currentProject und baut das Modal komplett neu auf.
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
    const top = (window.innerHeight - modalHeight) / 2;

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
    // Der Shader wird hier mit der passenden Kategorie-Farbe gestartet
    populateModal(project);

    document.body.style.overflow = 'hidden';
}

/**
 * Startet die Wasser-Close-SVG-Animation (water_distort_close) neu und wirft
 * den Water-Effekt auf den Schließen-Button. EINZIGE Stelle für diesen Ablauf –
 * verwendet von Modal-Close (closePopup) und Lightbox-Close (closeLightbox),
 * damit der Code nicht doppelt existiert.
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
 * Close popup with water animation
 */
function closePopup() {
    if (!currentProject) return;

    // Lightbox schließen, falls noch geöffnet
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

    // Trigger water_distort_close SVG animation (same as water_emerge opening)
    const closeBtn = modalContainer.querySelector('.modal_close_btn');
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
        document.body.style.overflow = '';
    }, WATER_ANIMATION_MS);
}

/**
 * Populate modal with project data (neue Struktur)
 */
function populateModal(project) {
    const lang = getCurrentLang();

    // Lightbox schließen, falls ein anderes Projekt geladen wird
    if (lightboxOpen) closeLightbox();

    // Wasser-Hintergrund basierend auf Kategorie (CSS-Gradient + Shader-Farbe)
    const bgClasses = ['modal_bg_abyss', 'modal_bg_teal', 'modal_bg_ocean', 'modal_bg_bio', 'modal_bg_amber', 'modal_bg_rose'];
    modalContainer.classList.remove(...bgClasses);
    const scheme = currentProject ? getCategorySchemeIndex(currentProject.category) : 0;
    if (scheme >= 0 && scheme < bgClasses.length) {
        modalContainer.classList.add(bgClasses[scheme]);
    }
    // Shader-Farbe der Kategorie setzen (funktioniert auch bei laufendem Shader)
    if (modalShader) {
        modalShader.start(scheme);
    }

    // Header
    const titleEl = modalContainer.querySelector('.modal_project_title');
    const subtitleEl = modalContainer.querySelector('.modal_project_subtitle');
    const categoryEl = modalContainer.querySelector('.modal_project_category');
    titleEl.textContent = project.title;
    subtitleEl.textContent = getProjectSubtitle(currentProjectIndex, lang) || project.subtitle || '';
    categoryEl.textContent = getCategoryLabel(project.category, lang) || '';

    // Projekt-Auswahl-Leiste fuer die aktuelle Kategorie bauen (Ebene 2)
    buildProjectBar();

    // Beschreibung (links)
    const descriptionEl = modalContainer.querySelector('.modal_project_description');
    descriptionEl.textContent = getProjectDescription(currentProjectIndex, lang) || project.description || '';

    // Contribution (rechts)
    const contributionList = modalContainer.querySelector('.modal_contribution_list');
    const contributions = getProjectContribution(currentProjectIndex, lang) || project.contribution || [];
    contributionList.innerHTML = '';
    contributions.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        contributionList.appendChild(li);
    });

    // Tools & Skills
    const skillsGridEl = modalContainer.querySelector('.modal_skills_grid');
    skillsGridEl.innerHTML = '';
    const tools = project.tools || [];
    tools.forEach((tool, index) => {
        const tag = document.createElement('span');
        // tools[0] = Haupttool -> hervorgehoben
        tag.className = 'modal_skill_tag' + (index === 0 ? ' main' : '');
        if (tool.icon) {
            tag.innerHTML = `<i class='bx ${tool.icon}'></i> ${tool.name}`;
        } else {
            tag.textContent = tool.name;
        }
        skillsGridEl.appendChild(tag);
    });

    // Medien + Thumbnails
    currentMediaIndex = 0;
    buildThumbnails(project);
    showMedia(0);

    // Ziel: Projekt-Navigation aktualisieren (Label, Tooltips, Deaktivierung)
    updateProjectNav();

    // Cleanup alter Cycle-Timer
    if (modalContainer._cleanupCycle) {
        modalContainer._cleanupCycle();
        modalContainer._cleanupCycle = null;
    }
}

/**
 * Baue die Thumbnail-Leiste für alle Medien des Projekts
 */
function buildThumbnails(project) {
    const bar = modalContainer.querySelector('.modal_thumb_bar');
    bar.innerHTML = '';

    const media = Array.isArray(project.media) ? project.media : [];
    media.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'modal_thumb';
        btn.setAttribute('aria-label', `Media ${index + 1}`);

        const img = document.createElement('img');
        img.src = item.thumb || item.src || '';
        img.alt = `${project.title} - media ${index + 1}`;
        img.loading = 'lazy';
        applyImageFallback(img, project.category);
        btn.appendChild(img);

        // Video-Thumbnails bekommen ein kleines Play-Symbol
        if (item.type === 'video') {
            const badge = document.createElement('span');
            badge.className = 'modal_thumb_badge';
            badge.textContent = '▶';
            btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
            currentMediaIndex = index;
            showMedia(index);
                        // Thumbnail-Klick öffnet direkt die Lightbox mit dem vergrößerten Medium
            openLightbox();
            triggerMediaFeedback();
        });

        bar.appendChild(btn);
    });
}


/**
 * Zeige ein Medienelement (Bild oder Video) in den uebergebenen Elementen an.
 * Gemeinsame Logik fuer Haupt-Media-Viewer (showMedia) und Lightbox (syncLightbox),
 * damit die Video-/Bild-Render-Logik nur an EINER Stelle liegt.
 * @param {HTMLImageElement} imageEl - Bild-Element, das gefuellt wird
 * @param {HTMLVideoElement} videoEl - Video-Element, das gefuellt wird
 * @param {{type:string}|undefined} item - Medienobjekt (item.type === 'video' oder Bild)
 * @param {Object} opts - Optionen
 * @param {boolean} opts.showControls - Native Controls am Video setzen/entfernen
 * @param {HTMLElement|null} opts.playBtn - Play-Overlay-Button (wird gezeigt/versteckt)
 * @param {string} altText - Alt-Text fuer Bilder
 * @param {string} category - Projekt-Kategorie (fuer Fallback-Bilder)
 */
function renderMediaItem(imageEl, videoEl, item, opts, altText, category) {
    if (item.type === 'video') {
        imageEl.style.display = 'none';
        videoEl.style.display = 'block';
        videoEl.setAttribute('src', item.src);
        if (item.thumb) videoEl.setAttribute('poster', item.thumb);
        videoEl.load();
        if (opts.showControls) videoEl.setAttribute('controls', '');
        if (opts.playBtn) opts.playBtn.style.display = 'flex';
    } else {
        videoEl.style.display = 'none';
        if (opts.showControls) videoEl.removeAttribute('controls');
        videoEl.removeAttribute('src');
        videoEl.load();
        if (opts.playBtn) opts.playBtn.style.display = 'none';
        imageEl.src = item.src || '';
        applyImageFallback(imageEl, category);
        imageEl.alt = altText;
        imageEl.style.display = 'block';
    }
}

/**
 * Zeige das Medium an Position `index` im Haupt-Viewer an
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

    // Altes Video stoppen
    videoEl.pause();
    videoEl.removeAttribute('controls');

    renderMediaItem(imageEl, videoEl, item, { showControls: false, playBtn }, project.title, project.category);

    // Aktives Thumbnail markieren (goldener Rahmen)
    const thumbs = modalContainer.querySelectorAll('.modal_thumb');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });

        // Lightbox-Inhalt synchronisieren, falls geöffnet
    if (lightboxOpen) syncLightbox();
}

/**
 * Trigger a brief teal "water-like" glow + fade on the active media
 * whenever the selected image changes (viewer prev/next, thumbnails,
 * lightbox prev/next). One-shot CSS animation – no JS animation loop.
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
 * Reuses the existing 0.3s transition of .modal_project_item – no JS loop.
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
 * Play-Button: spielt das aktuelle Video ab
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
                // Autoplay blockiert o.ae. -> Controls bleiben sichtbar
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


/* ========================================= */
/* LIGHTBOX FÜR DEN MEDIA-VIEWER (Vollbild)   */
/* ========================================= */

/**
 * Erstellt das Lightbox-Overlay als separates Element im body.
 * Wird unabhängig vom Haupt-Modal positioniert (z-index 2000).
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
            <img class="modal_lightbox_image" src="" alt="">
            <video class="modal_lightbox_video" playsinline preload="metadata" controls></video>
        </div>
    `;

    document.body.appendChild(lightboxOverlay);

    lightboxContainer = lightboxOverlay.querySelector('.modal_lightbox');
    lightboxImage = lightboxOverlay.querySelector('.modal_lightbox_image');
    lightboxVideo = lightboxOverlay.querySelector('.modal_lightbox_video');
}

/**
 * Verdrahtet die Lightbox-Events:
 * - Klick auf Media-Stage öffnet die Lightbox
 * - Klick auf X-Button oder Overlay-Hintergrund schließt sie
 * - Pfeile navigieren durch die Medien des aktuellen Projekts
 */
function setupLightbox() {
    const mediaStage = modalContainer.querySelector('.modal_media_stage');
    mediaStage.addEventListener('click', (e) => {
        // Play-Button-Klick nicht als Lightbox-Öffnung interpretieren
        if (e.target.closest('.modal_media_play')) return;
        openLightbox();
    });

    // X-Button schließt die Lightbox
    const closeBtn = lightboxOverlay.querySelector('.modal_close_btn');
    closeBtn.addEventListener('click', closeLightbox);

    // Klick auf Overlay-Hintergrund schließt die Lightbox
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
 * Öffnet die Lightbox und zeigt das aktuell ausgewählte Medium.
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
 * Schließt die Lightbox und pausiert das Video.
 */
function closeLightbox() {
    if (!lightboxOverlay) return;
    if (!lightboxOpen) return; // bereits geschlossen / Close-Animation läuft

    lightboxOpen = false;

    // Video pausieren, ABER das Bild für die Close-Animation sichtbar lassen
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
 * Aktualisiert die Lightbox-Ansicht auf das aktuell ausgewählte Medium
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
    renderMediaItem(lightboxImage, lightboxVideo, item, { showControls: true, playBtn: null }, project.title || '', project.category);
}


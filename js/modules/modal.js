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
} from '../constants/projects.js?v=4';
import { initModalShader } from './modal_shader.js';

let modalOverlay = null;
let modalContainer = null;
let modalShader = null;
let currentProject = null;
let projectsList = [];
let currentProjectIndex = 0;
let currentMediaIndex = 0;

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

        <div class="modal-content">
            <div class="modal-cat-tabs" role="tablist" aria-label="Project categories"></div>

            <!-- PROJEKT-AUSWAHL-LEISTE (Ebene 2: Projekte innerhalb der aktuellen Kategorie) -->
            <div class="modal-project-bar" role="group" aria-label="Projects in category"></div>

            <div class="modal-project-header">
                <h2 class="modal-project-title"></h2>
                <span class="modal-project-category"></span>
                <p class="modal-project-subtitle"></p>
                <div class="modal-project-switch">
                    <button class="modal-project-prev" aria-label="Previous project" title="">‹</button>
                    <span class="modal-project-switch-label"></span>
                    <button class="modal-project-next" aria-label="Next project" title="">›</button>
                </div>
            </div>

            <!-- HAUPT-MEDIA-VIEWER -->
            <div class="modal-media-viewer">
                <div class="modal-media-stage">
                    <img class="modal-media-image" src="" alt="">
                    <video class="modal-media-video" playsinline preload="metadata"></video>
                    <button class="modal-media-play" aria-label="Play video">▶</button>
                </div>
                <button class="modal-media-prev" aria-label="Previous media">‹</button>
                <button class="modal-media-next" aria-label="Next media">›</button>
            </div>

            <!-- THUMBNAIL-LEISTE -->
            <div class="modal-thumb-bar"></div>

            <!-- ZWEI-SPALTEN-BEREICH -->
            <div class="modal-info-grid">
                <div class="modal-description-col">
                    <p class="modal-project-description"></p>
                </div>
                <div class="modal-contribution-col">
                    <h3 class="modal-contribution-title">My Contribution</h3>
                    <ul class="modal-contribution-list"></ul>
                </div>
            </div>

            <!-- TOOLS & SKILLS -->
            <div class="modal-skills-section">
                <h3 class="modal-skills-title">Tools & Skills used</h3>
                <div class="modal-skills-grid"></div>
            </div>
        </div>
    `;

    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);

    // Media-Events (Play-Button/Video) einmalig verdrahten
    setupMediaEvents();

    // Initialize voronoi shader background (unveraendert)
    modalShader = initModalShader(modalContainer);
}

/**
 * Attach event listeners
 */
function attachEventListeners(projects) {
    projectsList = projects;

    const closeBtn = modalContainer.querySelector('.modal-close-btn');
    closeBtn.addEventListener('click', () => closePopup());

    const mediaPrev = modalContainer.querySelector('.modal-media-prev');
    const mediaNext = modalContainer.querySelector('.modal-media-next');
    mediaPrev.addEventListener('click', () => navigateMedia(-1));
    mediaNext.addEventListener('click', () => navigateMedia(1));

    const projectPrev = modalContainer.querySelector('.modal-project-prev');
    const projectNext = modalContainer.querySelector('.modal-project-next');
    projectPrev.addEventListener('click', () => navigateProject(-1));
    projectNext.addEventListener('click', () => navigateProject(1));

    // Kategorie-Reiter (Delegation: Reiter werden dynamisch neu gebaut)
    const catTabs = modalContainer.querySelector('.modal-cat-tabs');
    catTabs.addEventListener('click', (e) => {
        const tab = e.target.closest('.modal-cat-tab');
        if (tab && tab.dataset.category) {
            switchCategory(tab.dataset.category);
        }
    });

    // Projekt-Auswahl-Leiste (Ebene 2) - Klick-Delegation
    const projectBar = modalContainer.querySelector('.modal-project-bar');
    if (projectBar) {
        projectBar.addEventListener('click', (e) => {
            const item = e.target.closest('.modal-project-item');
            if (item && item.dataset.index !== undefined) {
                switchToProjectIndex(parseInt(item.dataset.index));
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
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
}

/**
 * Baut die Kategorie-Reiter (Tabs) ins Modal.
 * Der aktive Reiter markiert die aktuell geoeffnete Kategorie.
 */
function buildCategoryTabs() {
    const tabsEl = modalContainer.querySelector('.modal-cat-tabs');
    if (!tabsEl) return;
    const lang = getCurrentLang();

    tabsEl.innerHTML = '';
    getCategories().forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'modal-cat-tab';
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

    const switchRow = modalContainer.querySelector('.modal-project-switch');
    const prevBtn = modalContainer.querySelector('.modal-project-prev');
    const nextBtn = modalContainer.querySelector('.modal-project-next');
    const labelEl = modalContainer.querySelector('.modal-project-switch-label');

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
    const bar = modalContainer.querySelector('.modal-project-bar');
    if (!bar) return;
    bar.innerHTML = '';
    if (!currentProject) return;

    const indices = getProjectIndicesByCategory(currentProject.category);
    indices.forEach(idx => {
        const project = projectsList[idx];
        if (!project) return;

        const item = document.createElement('button');
        item.className = 'modal-project-item';
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
        label.className = 'modal-project-item-label';
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

    // Populate content (including media + thumbnails)
    // Der Shader wird hier mit der passenden Kategorie-Farbe gestartet
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

    // Pause any playing video before closing
    const video = modalContainer.querySelector('.modal-media-video');
    if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
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
 * Populate modal with project data (neue Struktur)
 */
function populateModal(project) {
    const lang = getCurrentLang();

    // Wasser-Hintergrund basierend auf Kategorie (CSS-Gradient + Shader-Farbe)
    const bgClasses = ['modal-bg-abyss', 'modal-bg-teal', 'modal-bg-ocean', 'modal-bg-bio', 'modal-bg-amber', 'modal-bg-rose'];
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
    const titleEl = modalContainer.querySelector('.modal-project-title');
    const subtitleEl = modalContainer.querySelector('.modal-project-subtitle');
    const categoryEl = modalContainer.querySelector('.modal-project-category');
    titleEl.textContent = project.title;
    subtitleEl.textContent = getProjectSubtitle(currentProjectIndex, lang) || project.subtitle || '';
    categoryEl.textContent = getCategoryLabel(project.category, lang) || '';

    // Projekt-Auswahl-Leiste fuer die aktuelle Kategorie bauen (Ebene 2)
    buildProjectBar();

    // Beschreibung (links)
    const descriptionEl = modalContainer.querySelector('.modal-project-description');
    descriptionEl.textContent = getProjectDescription(currentProjectIndex, lang) || project.description || '';

    // Contribution (rechts)
    const contributionList = modalContainer.querySelector('.modal-contribution-list');
    const contributions = getProjectContribution(currentProjectIndex, lang) || project.contribution || [];
    contributionList.innerHTML = '';
    contributions.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        contributionList.appendChild(li);
    });

    // Tools & Skills
    const skillsGridEl = modalContainer.querySelector('.modal-skills-grid');
    skillsGridEl.innerHTML = '';
    const tools = project.tools || [];
    tools.forEach((tool, index) => {
        const tag = document.createElement('span');
        // tools[0] = Haupttool -> hervorgehoben
        tag.className = 'modal-skill-tag' + (index === 0 ? ' main' : '');
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
    const bar = modalContainer.querySelector('.modal-thumb-bar');
    bar.innerHTML = '';

    const media = Array.isArray(project.media) ? project.media : [];
    media.forEach((item, index) => {
        const btn = document.createElement('button');
        btn.className = 'modal-thumb';
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
            badge.className = 'modal-thumb-badge';
            badge.textContent = '▶';
            btn.appendChild(badge);
        }

        btn.addEventListener('click', () => {
            currentMediaIndex = index;
            showMedia(index);
        });

        bar.appendChild(btn);
    });
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
    const imageEl = modalContainer.querySelector('.modal-media-image');
    const videoEl = modalContainer.querySelector('.modal-media-video');
    const playBtn = modalContainer.querySelector('.modal-media-play');

    // Altes Video stoppen
    videoEl.pause();
    videoEl.removeAttribute('controls');

    if (item.type === 'video') {
        // Video anzeigen, Poster (Thumbnail) nutzen, Play-Overlay zeigen
        imageEl.style.display = 'none';
        videoEl.style.display = 'block';
        videoEl.setAttribute('src', item.src);
        if (item.thumb) videoEl.setAttribute('poster', item.thumb);
        videoEl.load();
        playBtn.style.display = 'flex';
    } else {
        // Bild anzeigen
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();
        videoEl.style.display = 'none';
        playBtn.style.display = 'none';
        imageEl.src = item.src || '';
        applyImageFallback(imageEl, project.category);
        imageEl.alt = project.title;
        imageEl.style.display = 'block';
    }

    // Aktives Thumbnail markieren (goldener Rahmen)
    const thumbs = modalContainer.querySelectorAll('.modal-thumb');
    thumbs.forEach((t, i) => {
        t.classList.toggle('active', i === index);
    });
}

/**
 * Play-Button: spielt das aktuelle Video ab
 */
function setupMediaEvents() {
    const playBtn = modalContainer.querySelector('.modal-media-play');
    const videoEl = modalContainer.querySelector('.modal-media-video');

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


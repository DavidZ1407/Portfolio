/* ========================================= */
/* MODULE - 3D PORTAL CAROUSEL */
/* Auto-rotate + click + bubbles + 3D Tilt */
/* ========================================= */

import { cleanupRegistry, debounce, sizeCanvas, bindHorizontalSwipe } from '../utils/helpers.js';
import { registerAnimation } from '../utils/animation_manager.js';
import { projects, getProjectSubtitle, getProjectCover, getProjectTitle, getCategories, getCategoryLabel, getFirstProjectOfCategory, getOrderedProjectIndices, applyImageFallback } from '../constants/projects.js?v=7';
import { getCurrentLang } from './language.js';

let modalOpenCallback = null;
let currentCenter = 0;
let autoTimer = null;
let isAutoCycling = false;
let isPaused = false;
let activeMainCategory = null;
let TOTAL_SLIDES = 0;
const AUTO_INTERVAL = 9000;         // Auto-Rotation nach 9s ohne Interaktion
const AUTO_RESUME_DELAY_MS = 8000;  // Auto-Rotation nach Pause wieder aufnehmen
const RESIZE_BOOT_DELAY_MS = 100;   // Erster Canvas-Resize nach dem Laden
const BUBBLE_COUNT = 30;            // Blasen im Portal-Canvas
const PARTICLE_COUNT = 40;

/* Kategorie-Akzent-Tints fuer den Wasser-Swirl (Bild-Rahmen-Vignette).
 * Farben = fgColor des Modal-Voronoi-Shaders (modal_shader.js, Schemes 0-5),
 * sodass jede Kategorie im Portal exakt die Farbe ihres Modal-Hintergrunds
 * traegt (z.B. 3d -> lila). Mix + Luminanz-Erhalt im Fragment-Shader unten. */
const CATEGORY_TINTS = {
    gamedev:  [0.550, 0.750, 1.000], /* modal fg: blue (scheme 0) */
    coding:   [0.400, 0.850, 0.800], /* modal fg: teal (scheme 1) */
    "3d":     [0.700, 0.550, 0.900], /* modal fg: purple (scheme 2) */
    concept:  [0.450, 0.800, 0.550], /* modal fg: green (scheme 3) */
    sound:    [1.000, 0.780, 0.400], /* modal fg: amber/gold (scheme 4) */
    other:    [0.950, 0.400, 0.600]  /* modal fg: rose (scheme 5) */
};

/* ---- 3D Tilt state ---- */
let tiltActive = false;
let tiltSlide = null;
let tiltInner = null;
let tiltShine = null;
let tiltAnimFrame = null;
const TILT_MAX_ANGLE = 14; // max degrees of tilt

/**
 * Build the 3D portal slides dynamically from projects.js
 * (eine Kategorie = ein Portal)
 */
function buildPortalSlides() {
    const carousel = document.querySelector('.portal-carousel');
    if (!carousel) return;

    // Bereits vorhandene Slides entfernen (Controls bleiben unberuehrt)
    carousel.querySelectorAll(':scope > .portal-slide').forEach(s => s.remove());

    const controls = carousel.querySelector('.carousel-controls');
    const lang = getCurrentLang();

    // Projekt-Karten kategorie-geordnet aufbauen (gleiche Reihenfolge wie im
    // Kategorie-Register: Game Dev -> Coding Web -> 3D -> Concept -> Sound -> Other).
    // Pro Kategorie wird nur das ERSTE Projekt angezeigt (ein Projekt je Bereich).
    const orderedProjectIndices = getOrderedProjectIndices();

    orderedProjectIndices.forEach((projectIdx, slideIndex) => {
        const project = projects[projectIdx];
        if (!project) return;

        const slide = document.createElement('div');
        slide.className = 'portal-slide';
        // data-index = Position im Carousel; data-project = Index in projects[]
        slide.dataset.index = String(slideIndex);
        slide.dataset.project = String(projectIdx);

        const img = document.createElement('img');
        img.src = getProjectCover(projectIdx) || '';
        img.alt = getProjectTitle(projectIdx, lang) || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        // Optional: Cover komplett zeigen (coverFit: 'contain'), kein Crop
        if (project.coverFit === 'contain') img.classList.add('fit-contain');
        // Fallback: fehlendes Cover -> Kategorie-Platzhalter
        applyImageFallback(img, project.category);
        slide.appendChild(img);

        const overlay = document.createElement('div');
        overlay.className = 'slide-overlay';
        const h2 = document.createElement('h2');
        h2.textContent = getProjectTitle(projectIdx, lang);
        const p = document.createElement('p');
        p.textContent = getProjectSubtitle(projectIdx, lang);
        overlay.appendChild(h2);
        overlay.appendChild(p);
        slide.appendChild(overlay);

        carousel.insertBefore(slide, controls);
    });
}

/**
 * Update Titel/Untertitel der Portal-Slides (bei Sprachwechsel)
 */
function renderPortalLabels() {
    const lang = getCurrentLang();
    document.querySelectorAll('.portal-slide').forEach((slide) => {
        const projectIdx = parseInt(slide.dataset.project);
        const project = projects[projectIdx];
        if (!project) return;
        const h2 = slide.querySelector('.slide-overlay h2');
        const p = slide.querySelector('.slide-overlay p');
        if (h2) h2.textContent = getProjectTitle(projectIdx, lang);
        if (p) p.textContent = getProjectSubtitle(projectIdx, lang);
    });
}

/**
 * Initialize the portal carousel
 * @param {Function} onOpenModal - callback(card) to open modal
 */
export function initPortal(onOpenModal) {
    modalOpenCallback = onOpenModal;

    // Slides dynamisch aus projects.js erzeugen (VOR Carousel-Init)
    buildPortalSlides();

    // Kategorie-Register fuer die Hauptseite (Level 1) aufbauen
    buildMainCategoryTabs();

    initBubbles();
    initCarousel();
    setupTiltStructure();
// Wasserstrudel-Medallions auf allen Karten (nicht-aktiv = geschlossen,
    // aktiv/hover = geoeffnet -> Bild sichtbar)
    initVortexShader();
    vortexSyncOpen();

    // Aktiven Kategorie-Tab mit dem zentrierten Slide synchronisieren
    syncMainCategoryTab();

    // Klick-Delegation fuer das Kategorie-Register (einmalig)
    const catContainer = document.querySelector('.main-cat-tabs');
    if (catContainer) {
        catContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.main-cat-item');
            if (item && item.dataset.category) {
                navigateToMainCategory(item.dataset.category);
            }
        });
    }

    // Labels bei Sprachwechsel aktualisieren
    document.addEventListener('languageChanged', renderPortalLabels);
    document.addEventListener('languageChanged', () => {
        buildMainCategoryTabs();
        syncMainCategoryTab();
    });
}

/* ---- MAIN-PAGE CATEGORY TABS ---- */
/**
 * Baut das Kategorie-Register (Level 1) ueber dem Portal-Carousel auf.
 * Ein Klick springt zum ersten Projekt der jeweiligen Kategorie.
 */
function buildMainCategoryTabs() {
    const container = document.querySelector('.main-cat-tabs');
    if (!container) return;
    container.innerHTML = '';
    const lang = getCurrentLang();
    getCategories().forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'main-cat-item';
        btn.dataset.category = cat;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        const label = getCategoryLabel(cat, lang);
        btn.textContent = label;
        btn.title = label;
        container.appendChild(btn);
    });
    setActiveMainCategory(activeMainCategory);
}

function findSlidePositionByProject(projectIdx) {
    const slides = document.querySelectorAll('.portal-slide');
    for (let i = 0; i < slides.length; i++) {
        if (parseInt(slides[i].dataset.project) === projectIdx) return i;
    }
    return -1;
}

function navigateToMainCategory(category) {
    const idx = getFirstProjectOfCategory(category);
    if (idx === null || idx === undefined) return;
    goToPortalSlide(idx);
    // Aktiver Tab wird ueber syncMainCategoryTab() (in updatePositions)
    // passend zum zentrierten Slide gesetzt.
    setActiveMainCategory(category);
}

function setActiveMainCategory(category) {
    activeMainCategory = category;
    document.querySelectorAll('.main-cat-item').forEach(item => {
        const selected = item.dataset.category === category;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-selected', selected ? 'true' : 'false');
    });
}

function syncMainCategoryTab() {
    const centerSlide = document.querySelector('.portal-slide.pos-center');
    if (!centerSlide) return;
    const projectIdx = parseInt(centerSlide.dataset.project);
    const project = projects[projectIdx];
    if (!project) return;
    setActiveMainCategory(project.category);
}

/**
 * Navigate the portal carousel to the slide belonging to a project index.
 * @param {number} projectIndex - Index in projects[] (aus Hero-Carousel / Kategorie-Tabs)
 */
export function goToPortalSlide(projectIndex) {
    const pos = findSlidePositionByProject(projectIndex);
    if (pos < 0 || pos >= TOTAL_SLIDES) return;
    
    const slides = document.querySelectorAll('.portal-slide');
    const dots = document.querySelectorAll('.c-dot');
    if (slides.length === 0 || dots.length === 0) return;
    
    pauseAuto();
    detachTilt();
    currentCenter = pos;
    updatePositions(slides, dots);
    resumeAutoAfterDelay();
}
window.goToPortalSlide = goToPortalSlide;



/* ========================================= */
/* 3D MOUSE TILT SETUP */
/* ========================================= */

/**
 * Add .tilt-inner and .tilt-shine elements to each slide
 */
function setupTiltStructure() {
    const slides = document.querySelectorAll('.portal-slide');
    slides.forEach(slide => {
        // Only add if not already present
        if (slide.querySelector('.tilt-inner')) return;

        // Find the image
        const img = slide.querySelector('img');
        if (!img) return;

        // Create tilt-inner wrapper
        const tiltInner = document.createElement('div');
        tiltInner.className = 'tilt-inner';

        // Move image into tilt-inner
        img.parentNode.insertBefore(tiltInner, img);
        tiltInner.appendChild(img);

        // Create shine overlay
        const shine = document.createElement('div');
        shine.className = 'tilt-shine';
        tiltInner.appendChild(shine);
    });
}

/**
 * Attach 3D tilt to the current center slide
 */
function attachTilt() {
    detachTilt(); // remove any existing tilt first

    const centerSlide = document.querySelector('.portal-slide.pos-center');
    if (!centerSlide) return;

    tiltSlide = centerSlide;
    tiltInner = centerSlide.querySelector('.tilt-inner');
    tiltShine = centerSlide.querySelector('.tilt-shine');

    if (!tiltInner || !tiltShine) return;

tiltSlide.addEventListener('focusin', onPortalFocusIn, { passive: true });
    tiltSlide.addEventListener('focusout', onPortalFocusOut, { passive: true });
    tiltSlide.addEventListener('mousemove', onTiltMove, { passive: true });
    tiltSlide.addEventListener('mouseleave', onTiltLeave, { passive: true });
    tiltSlide.addEventListener('mouseenter', onTiltEnter, { passive: true });
}

/**
 * Remove 3D tilt listeners and reset state
 */
function detachTilt() {
    if (tiltSlide) {
        tiltSlide.removeEventListener('mousemove', onTiltMove);
        tiltSlide.removeEventListener('mouseleave', onTiltLeave);
        tiltSlide.removeEventListener('mouseenter', onTiltEnter);
tiltSlide.removeEventListener('focusin', onPortalFocusIn);
        tiltSlide.removeEventListener('focusout', onPortalFocusOut);
    }

    // Reset visual state
    if (tiltInner) {
        tiltInner.style.transform = '';
        tiltInner.classList.remove('tilt-active', 'tilt-snap-back');
    }
    if (tiltShine) {
        tiltShine.style.background = '';
        tiltShine.classList.remove('tilt-active');
    }
    if (tiltSlide) {
        tiltSlide.classList.remove('tilt-lift');
    }

    if (tiltAnimFrame) {
        cancelAnimationFrame(tiltAnimFrame);
        tiltAnimFrame = null;
    }

    tiltActive = false;
    tiltSlide = null;
    tiltInner = null;
    tiltShine = null;
}
/** Tastatur-Fokus oeffnet den Strudel der fokussierten Karte (Bild-Reveal). */
function onPortalFocusIn() {
    const inst = vortexInstances.find(i => i.slide === tiltSlide);
    if (inst) inst.openTarget = 1;
}

/** Verlaesst der Fokus, schliessen sich nicht-aktive Karten wieder. */
function onPortalFocusOut() {
    const inst = vortexInstances.find(i => i.slide === tiltSlide);
    if (inst) {
        inst.openTarget = (tiltSlide && tiltSlide.classList.contains('pos-center')) ? 1 : 0;
    }
}

function onTiltEnter() {
    if (!tiltInner || !tiltShine) return;
    tiltActive = true;
    tiltInner.classList.remove('tilt-snap-back');
    tiltInner.classList.add('tilt-active');
    tiltShine.classList.add('tilt-active');
    if (tiltSlide) tiltSlide.classList.add('tilt-lift');
}

function onTiltMove(e) {
    if (!tiltActive || !tiltSlide || !tiltInner || !tiltShine) return;

    // Batch updates via rAF to avoid layout thrashing
    if (tiltAnimFrame) cancelAnimationFrame(tiltAnimFrame);
    tiltAnimFrame = requestAnimationFrame(() => {
        updateTilt(e);
    });
}

function updateTilt(e) {
    if (!tiltSlide || !tiltInner || !tiltShine) return;

    const rect = tiltSlide.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize mouse position to [-1, 1] range
    let normX = (e.clientX - centerX) / (rect.width / 2);
    let normY = (e.clientY - centerY) / (rect.height / 2);

    // Clamp to [-1, 1]
    normX = Math.max(-1, Math.min(1, normX));
    normY = Math.max(-1, Math.min(1, normY));

    // Calculate rotation: X axis tilts "away" (inverted for natural feel)
    const rotY = normX * TILT_MAX_ANGLE;
    const rotX = -normY * TILT_MAX_ANGLE;

    // Apply transform on tilt-inner (preserving the base translateZ from pos-center)
    tiltInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    // Update shine position: radial gradient follows mouse
    const px = ((normX + 1) / 2) * 100; // 0% to 100%
    const py = ((normY + 1) / 2) * 100; // 0% to 100%
    tiltShine.style.background = `radial-gradient(
        circle 150px at ${px}% ${py}%,
        rgba(201, 168, 97, 0.18) 0%,
        rgba(73, 146, 154, 0.08) 40%,
        transparent 70%
    )`;
}

function onTiltLeave() {
    tiltActive = false;

    if (tiltAnimFrame) {
        cancelAnimationFrame(tiltAnimFrame);
        tiltAnimFrame = null;
    }

    if (tiltInner) {
        tiltInner.classList.add('tilt-snap-back');
        tiltInner.classList.remove('tilt-active');
        tiltInner.style.transform = '';
    }
    if (tiltShine) {
        tiltShine.classList.remove('tilt-active');
        tiltShine.style.background = '';
    }
    if (tiltSlide) {
        tiltSlide.classList.remove('tilt-lift');
    }
}

/* ========================================= */
/* PORTAL VORTEX SHADER (WebGL)              */
/* Realistischer Wasserstrudel statt flachem */
/* CSS-Muster: organische Turbulenz (fbm),   */
/* Kausik, Schaumringe, dunkler Trichter,    */
/* driftende Partikel. Geschlossen deckt das */
/* Wasser die Karte; Hover/Fokus oeffnet und */
/* loest es nach aussen auf -> Bild sichtbar.*/
/* ========================================= */

const vortexVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const vortexFragmentShader = `
    precision highp float;
    uniform float uTime;
    uniform vec2  uResolution;
    uniform float uOpen;
    uniform vec3  uCategoryTint;
    uniform float uFlash;
    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
    }
    float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.03;
            a *= 0.5;
        }
        return v;
    }

    void main() {
        float aspect = uResolution.x / max(uResolution.y, 1.0);
        float t = uTime;
        float open = uOpen;

        // Mittelpunkt atmet sanft -> der Strudel wirkt nie statisch
        vec2 center = vec2(0.5, 0.5) + vec2(sin(t * 0.21) * 0.012, cos(t * 0.27) * 0.012);
        vec2 p = (vUv - center) * vec2(aspect, 1.0);

        float r = length(p);
        float ang = atan(p.y, p.x);

        // Palette: dunkles Tiefblau -> Teal -> Aqua -> Schaum
        vec3 deep = vec3(0.006, 0.028, 0.052);
        vec3 body = vec3(0.022, 0.110, 0.150);
        vec3 teal = vec3(0.052, 0.270, 0.305);
        vec3 aqua = vec3(0.170, 0.540, 0.560);
        vec3 foam = vec3(0.730, 0.945, 0.960);

        // Wirbel: geschlossen langsam, beim Oeffnen schneller & weiter
        float spin    = 0.20 + open * 0.55;
        float winding = 3.40 - open * 2.10;

        // Organische Turbulenz im Wirbelraum (kein Speichenmuster)
        vec2 swirlBase = vec2(cos(ang), sin(ang)) * (0.8 + r * 3.0);
        float turb = fbm(swirlBase * 0.85 + vec2(t * 0.11, -t * 0.08)) - 0.5;

        float spiral = ang + t * spin + r * winding + turb * 1.7;

        // Dunkler Trichter in der Mitte, weitet sich beim Oeffnen
        float funnelR = 0.15 + open * 0.50;
        float funnel  = smoothstep(funnelR, 0.02, r);
        vec3 col = mix(body, deep, funnel);

        // Konzentrische Ringe, die nach innen fliessen
        float rings = sin(r * 26.0 - t * 1.05 + spiral * 2.0 + turb * 4.0);
        col += teal * (0.5 + 0.5 * rings) * 0.13 * (1.0 - r * 0.6);

        // Kausik (Lichtflecken im Wasser)
        float cq = fbm(vec2(cos(spiral), sin(spiral)) * 3.4 + vec2(r * 8.0 - t * 0.7, t * 0.5));
        float caustic = smoothstep(0.52, 0.80, cq);
        col += aqua * caustic * 0.32;
        col += foam * caustic * 0.10;

        // Schaumkronen-Ringe an der Trichterlippe, organisch wabbelnd
        float c1 = smoothstep(0.045, 0.0, abs(r - (0.24 + 0.020 * sin(t * 0.7)  + turb * 0.05)));
        float c2 = smoothstep(0.070, 0.0, abs(r - (0.44 + 0.028 * sin(t * 0.45 + 2.0) + turb * 0.06)));
        col += aqua * (c1 * 0.42 + c2 * 0.20);
        col += foam * (c1 * 0.24 + c2 * 0.09);

        // Glimmen tief im Schlund
        float throat = exp(-r * 7.5);
        col += aqua * throat * 0.60;
        col += foam * throat * 0.10 * (0.5 + 0.5 * sin(t * 1.3));

        // Driftende Partikel / Blasen, die nach innen sinken
        float sp = noise(vec2(cos(spiral) * 5.0 + t * 0.18, r * 4.0 - t * 0.7));
        float sparkle = pow(sp, 16.0);
        col += foam * sparkle * 0.30;

        // ---- Farbton pro Kategorie: leuchtender, farbiger Wasser-Swirl ----
        vec3 tint = uCategoryTint;
        float lumA = dot(col, vec3(0.2126, 0.7152, 0.0722));
        vec3 tinted = mix(col, tint, 0.5);   // Modal-Shader-Palette als Akzent
        float lumB = dot(tinted, vec3(0.2126, 0.7152, 0.0722));
        col = tinted * (lumA / max(lumB, 0.0001));   // Helligkeit/Glow erhalten

        // ---- Weiche Radial-Vignettierung: kein harter Schnitt ----
        // col verliert in die Ecken hinein an Leuchtkraft -> natuerliche
        // Adaequung in die dunkle Karte, keine 4 separaten Eck-Spuren.
        float vignette = 1.0 - smoothstep(0.40, 0.66, r);
        col *= 0.60 + 0.40 * vignette;

        // ---- Bild-Rahmen-Vignette: Wasser nur am RAND (keine Mitte) ----
        // KreisVignette: Mitte klar (Alpha ~ 0), Energie/Swirl im aeusseren Rand,
        // wird am Rand (r ~ 0.48-0.52) staerker und gegen die Ecken abgeblendet,
        // sodass keine 4ecken-Konzentration entsteht (rund statt eckig).
        float edgeGlow  = smoothstep(0.30, 0.48, r) * (1.0 - smoothstep(0.52, 0.72, r));
        // Rahmen/Ecken solide: Beim Oeffnen darf NUR die Bild-Mitte frei
        // bleiben. Radial zu den 4 Ecken hin sowie entlang des oberen und
        // seitlichen Kartenrahmens wird das Wasser voll opak (Vignette) -
        // keine durchsichtigen Ecken mehr, hinter denen der Seitenhintergrund
        // aufscheint. Unten bleibt die Textzone in der Mitte frei (lesbar).
        vec2  qRect       = abs(vUv - vec2(0.5)) * 2.0;   // 0 Mitte -> 1 Kartenrand
        float cornerSolid = smoothstep(0.52, 0.62, r);
        float frameSolid  = max(
            smoothstep(0.925, 0.995, qRect.x),                     // seitlicher Rahmen
            smoothstep(0.925, 0.995, qRect.y) * step(0.5, vUv.y)   // oberer Rahmen
        );
        float openBorder = max(0.75 * edgeGlow, max(cornerSolid, frameSolid));
        // ---- Hover-Farbblitz: Portal "energized" kurz in seiner Kategorie-Farbe ----
        // (ersetzt den entfernten weissen Specular-Glow). uFlash wird per JS
        // bei mouseenter auf 1 gesetzt und klingt dort exponentiell ab (~0.8s).
        float ringBoost = 0.35 + 0.65 * edgeGlow + 0.55 * throat;
        col = mix(col, uCategoryTint * (0.85 + 0.40 * caustic), uFlash * 0.45);
        col += uCategoryTint * uFlash * 0.50 * ringBoost;

        // geschlossen (open=0): Wasser vollstaendig deckend (Bild versteckt);
        // geoeffnet (open=1):   Wasser nur am Rand, Mitte klar (Bild sichtbar)
        float alpha = mix(1.0, openBorder, open);
        gl_FragColor = vec4(col, alpha);

    }
`;

let vortexInstances = [];
let vortexUnregisterAnim = null;
let vortexSectionVisible = true;

/**
 * Erzeugt fuer EINE Karte ein eigenes Wasserstrudel-Medallion.
 * Nicht-aktive Karten zeigen den geschlossenen Wirbel; Hover oder
 * Zentral-Position oeffnet ihn (Wasser zieht sich von den Kanten her
 * in die Mitte zurueck -> Bild wird sichtbar). Seamless: keilrunde,
 * weiche Ausblendung statt harter Kasten-Kante.
 */
function createVortexInstance(slide) {
    const THREE = window.THREE;
    if (!THREE || !slide) return null;

    const renderer = new THREE.WebGLRenderer({
        alpha: true, antialias: true, powerPreference: 'high-performance'
    });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = 'portal-vortex-canvas';
    // KEIN Rahmen/Kasten, KEINE runde Maske, KEIN screen-Blend:
    // - ohne runde Maske deckt das Wasser geschlossen die ganze Karte
    //   (auch die 4 Ecken) -> kein rechteckiger Rahmen mehr sichtbar
    // - ohne mix-blend-mode bleibt das dunkle Wasser undurchsichtig,
    //   sodass Bild/Text der geschlossenen Karte vollständig verdeckt ist
    // - weiche, kreisende Öffnungskante entsteht ausschließlich im Shader
    //   (siehe edgeGlow-Vignette), was beim Oeffnen von den Kanten her
    //   aufloest (seamless)
    canvas.style.cssText = [
        'position:absolute;top:0;left:0;width:100%;height:100%;',
        'z-index:8;pointer-events:none;'
    ].join('');

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    scene.background = null;

    const uniforms = {
        uTime: { value: Math.random() * 100 },
        uResolution: { value: [1, 1] },
        uOpen: { value: slide.classList.contains('pos-center') ? 1 : 0 },
        uFlash: { value: 0 }
    };
    const _pIdx = parseInt(slide.dataset.project);
    const _cat  = (projects[_pIdx] && projects[_pIdx].category) || "other";
    uniforms.uCategoryTint = { value: CATEGORY_TINTS[_cat] || CATEGORY_TINTS.other || [1, 1, 1] };

    const material = new THREE.ShaderMaterial({
        vertexShader: vortexVertexShader,
        fragmentShader: vortexFragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    slide.appendChild(canvas);

    function size() {
        const w = slide.clientWidth || 1;
        const h = slide.clientHeight || 1;
        if (w > 0 && h > 0) {
            renderer.setSize(w, h, false);
            uniforms.uResolution.value = [w * pixelRatio, h * pixelRatio];
        }
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(slide);

    const inst = {
        slide, renderer, canvas, uniforms, material, scene, camera, ro,
        openTarget: slide.classList.contains('pos-center') ? 1 : 0,
        flashV: 0
    };

    // Hover = kurzer Farbblitz in der Kategorie-Farbe (kein weisser Glow mehr)
    slide.addEventListener('mouseenter', () => { inst.flashV = 1; }, { passive: true });

    vortexInstances.push(inst);
    return inst;
}

/** Initialisiert die Vortex-Medallions auf allen Karten. */
function initVortexShader() {
    if (vortexInstances.length) return;

    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[portal-vortex] Three.js not loaded – ohne Wasserstrudel.');
        return;
    }
    let reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { /* ignore */ }
    if (reduced) return; // Bild bleibt dauerhaft sichtbar

    document.querySelectorAll('.portal-slide').forEach(createVortexInstance);
    if (!vortexInstances.length) return;

    vortexUnregisterAnim = registerAnimation((now, dt) => {
        const delta = dt || 1 / 60;
        for (const inst of vortexInstances) {
            if (!vortexSectionVisible) continue;
            if (!inst.canvas.isConnected) continue;
            inst.uniforms.uTime.value += delta;
            const ease = 1 - Math.exp(-delta * 3.5);
            inst.uniforms.uOpen.value += (inst.openTarget - inst.uniforms.uOpen.value) * ease;
            // Farbblitz-Puls: sofort voll (mouseenter), exponentiell abklingend
            if (inst.flashV > 0.002) {
                inst.flashV *= Math.exp(-delta * 3.4);
            } else {
                inst.flashV = 0;
            }
            inst.uniforms.uFlash.value = inst.flashV;
            inst.renderer.render(inst.scene, inst.camera);
        }
    });

    const section = document.querySelector('.archives_section');
    if (section) {
        const obs = new IntersectionObserver((entries) => {
            vortexSectionVisible = entries[0].isIntersecting;
        }, { threshold: 0.05 });
        obs.observe(section);
    }

    cleanupRegistry.register(() => {
        vortexSectionVisible = false;
        if (vortexUnregisterAnim) { vortexUnregisterAnim(); vortexUnregisterAnim = null; }
        vortexInstances.forEach(inst => {
            inst.ro.disconnect();
            if (inst.canvas.parentNode) inst.canvas.parentNode.removeChild(inst.canvas);
            inst.renderer.dispose();
        });
        vortexInstances = [];
    });
}

/** Synchronisiert den Oeffnungsgrad nach jedem Kartenwechsel:
 *  NUR die zentrierte (aktive) Karte ist offen -> Bild sichtbar.
 *  Alle anderen Karten sind komplett geschlossen (Wasserstrudel oben). */
function vortexSyncOpen() {
    document.querySelectorAll('.portal-slide').forEach(slide => {
        const inst = vortexInstances.find(i => i.slide === slide);
        if (inst) {
            inst.openTarget = slide.classList.contains('pos-center') ? 1 : 0;
        }
    });
}
/* ========================================= */
/* CAROUSEL */
/* ========================================= */

function initCarousel() {
    const slides = document.querySelectorAll('.portal-slide');
    const dots = document.querySelectorAll('.c-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const section = document.querySelector('.archives_section');

    if (slides.length === 0) return;

    // Set ARIA labels on navigation buttons
    if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous slide');
    if (nextBtn) nextBtn.setAttribute('aria-label', 'Next slide');

    // Set TOTAL_SLIDES dynamically
    TOTAL_SLIDES = slides.length;

    let cleanupListeners = [];

    // Touch-Swipe: nach links zur naechsten Karte, nach rechts zur vorherigen
    const carouselEl = document.querySelector('.portal-carousel');
    if (carouselEl && slides.length > 0) {
        const cleanupSwipe = bindHorizontalSwipe(
            carouselEl,
            () => {
                pauseAuto();
                detachTilt();
                currentCenter = (currentCenter + 1) % TOTAL_SLIDES;
                updatePositions(slides, dots);
                resumeAutoAfterDelay();
            },
            () => {
                pauseAuto();
                detachTilt();
                currentCenter = (currentCenter - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
                updatePositions(slides, dots);
                resumeAutoAfterDelay();
            }
        );
        cleanupListeners.push(cleanupSwipe);
    }

    // Set ARIA labels on slides
    slides.forEach((slide, i) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.setAttribute('aria-label', `Project ${i + 1} of ${TOTAL_SLIDES}`);
    });

    // Set initial positions
    updatePositions(slides, dots);

    // Navigation buttons
    if (prevBtn) {
        const onPrev = () => {
            pauseAuto();
            detachTilt();
            currentCenter = (currentCenter - 1 + TOTAL_SLIDES) % TOTAL_SLIDES;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        prevBtn.addEventListener('click', onPrev);
        cleanupListeners.push(() => prevBtn.removeEventListener('click', onPrev));
    }

    if (nextBtn) {
        const onNext = () => {
            pauseAuto();
            detachTilt();
            currentCenter = (currentCenter + 1) % TOTAL_SLIDES;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        nextBtn.addEventListener('click', onNext);
        cleanupListeners.push(() => nextBtn.removeEventListener('click', onNext));
    }

    // Dot clicks
    dots.forEach((dot, i) => {
        const onDotClick = () => {
            pauseAuto();
            detachTilt();
            currentCenter = i;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        dot.addEventListener('click', onDotClick);
        cleanupListeners.push(() => dot.removeEventListener('click', onDotClick));
    });

    // Click on side slides → bring to center
    slides.forEach((slide) => {
        const onSlideClick = (e) => {
            const idx = parseInt(slide.dataset.index);

            if (idx === currentCenter) {
                // Center clicked → open modal
                e.preventDefault();
                e.stopPropagation();
                pauseAuto();
                if (modalOpenCallback) {
                    modalOpenCallback(slide);
                } else {
                    // Kein Callback gesetzt – nichts tun
                }
                return;
            }

            // Side clicked → bring to center
            e.preventDefault();
            e.stopPropagation();
            pauseAuto();
            detachTilt();
            currentCenter = idx;
            updatePositions(slides, dots);
            resumeAutoAfterDelay();
        };
        slide.addEventListener('click', onSlideClick);
        cleanupListeners.push(() => slide.removeEventListener('click', onSlideClick));
    });

    // Keyboard navigation for slides
    slides.forEach((slide) => {
        const onKeydown = (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                slide.click();
            }
        };
        slide.addEventListener('keydown', onKeydown);
        cleanupListeners.push(() => slide.removeEventListener('keydown', onKeydown));
    });

    // Start auto-cycle when visible
    let sectionObserver = null;
    if (section) {
        sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !isPaused) {
                    startAuto(slides, dots);
                } else {
                    stopAuto();
                }
            });
        }, { threshold: 0.15 });
        sectionObserver.observe(section);
    }

    // Resume auto-cycle when modal closes
    function onModalClose() {
        setTimeout(() => {
            isPaused = false;
            resumeAutoAfterDelay();
        }, 200);
    }

    // ESC key
    const onEscKey = (e) => {
        if (e.key === 'Escape') onModalClose();
    };
    document.addEventListener('keydown', onEscKey);
    cleanupListeners.push(() => document.removeEventListener('keydown', onEscKey));

    // Modal overlay click for close
    const overlay = document.querySelector('.project_modal_overlay');
    if (overlay) {
        const onOverlayClick = (e) => {
            if (e.target === overlay) onModalClose();
        };
        overlay.addEventListener('click', onOverlayClick);
        cleanupListeners.push(() => overlay.removeEventListener('click', onOverlayClick));
    }

    // Close button
    const closeBtn = document.querySelector('.modal_close_btn');
    if (closeBtn) {
        const onCloseClick = () => onModalClose();
        closeBtn.addEventListener('click', onCloseClick);
        cleanupListeners.push(() => closeBtn.removeEventListener('click', onCloseClick));
    }

    // MutationObserver fallback
    let mutObs = null;
    if (overlay) {
        mutObs = new MutationObserver((mutations) => {
            mutations.forEach((m) => {
                if (m.attributeName === 'style' && overlay.style.display === 'none') {
                    onModalClose();
                }
            });
        });
        mutObs.observe(overlay, { attributes: true, attributeFilter: ['style'] });
    }

    // Register cleanup
    cleanupRegistry.register(() => {
        stopAuto();
        detachTilt();
        cleanupListeners.forEach(fn => { try { fn(); } catch(e) {} });
        cleanupListeners = [];
        if (sectionObserver) sectionObserver.disconnect();
        if (mutObs) mutObs.disconnect();
    });
}

function updatePositions(slides, dots) {
    // Batch: remove all classes first, then add new ones in a single rAF
    // This avoids double reflow stutter while still allowing CSS transitions
    slides.forEach((slide) => {
        slide.classList.remove('pos-center', 'pos-left', 'pos-right', 'pos-hidden');
    });

    // Single forced reflow to register the "from" state before transitions
    void document.body.offsetHeight;

    slides.forEach((slide, i) => {
        // Calculate relative position
        let rel = i - currentCenter;
        if (rel < -1) rel += TOTAL_SLIDES;
        if (rel > 1) rel -= TOTAL_SLIDES;

        // Show ALL projects simultaneously - visual hierarchy:
        // centered project emphasized, neighbors reduced, further reduced
        if (rel === 0) {
            // Centered project - emphasized and enlarged
            slide.classList.add("pos-center");
            slide.setAttribute("aria-current", "true");
            slide.style.transform = `translateX(0) translateZ(100px) scale(1.12)`;
            slide.style.opacity = '1';
        } else if (rel === -1 || rel === 1) {
            // Neighboring projects - medium visibility with 3D positioning
            slide.classList.add("pos-" + (rel === -1 ? "left" : "right"));
            slide.setAttribute("aria-current", "false");
            slide.style.transform = `translateX(${rel === -1 ? -520 : 520}px) translateZ(-80px) rotateY(${rel === -1 ? 25 : -25}deg) scale(0.78)`;
            slide.style.opacity = '0.7';
        } else {
            // Further projects - reduced visibility but still visible
            // Use pos-hidden class but with overridden styles for visibility
            slide.classList.add("pos-hidden");
            // Inline styles override CSS defaults for visibility
            slide.style.opacity = '0.4';
            slide.style.pointerEvents = 'auto';
            slide.style.transform = `translateX(0) translateZ(-200px) scale(0.65)`;
        }
    });

    // Update dots
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentCenter);
        dot.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === currentCenter) {
            dot.setAttribute('aria-current', 'true');
        } else {
            dot.removeAttribute('aria-current');
        }
    });


    // Kategorie-Register aktualisieren (aktiver Tab folgt dem zentrierten Slide)
    syncMainCategoryTab();
    // Attach tilt to the new center slide (after transitions settle)
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            attachTilt();
        });
    });
// Wasserstrudel-Synchronisation: neue zentrierte Karte bleibt offen (Bild)
    vortexSyncOpen();
}

/* ---- Auto-cycle ---- */

function startAuto(slides, dots) {
    if (isAutoCycling) return;
    isAutoCycling = true;
    scheduleNext(slides, dots);
}

function stopAuto() {
    isAutoCycling = false;
    if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
    }
}

function scheduleNext(slides, dots) {
    if (!isAutoCycling) return;
    autoTimer = setTimeout(() => {
        if (!isAutoCycling) return;
        detachTilt();
        currentCenter = (currentCenter + 1) % TOTAL_SLIDES;
        updatePositions(slides, dots);
        scheduleNext(slides, dots);
    }, AUTO_INTERVAL);
}

function pauseAuto() {
    isPaused = true;
    stopAuto();
}

function resumeAutoAfterDelay() {
    // Resume auto after 8 seconds of inactivity
    isPaused = false;
    stopAuto();
    setTimeout(() => {
        if (!isPaused) {
            const slides = document.querySelectorAll('.portal-slide');
            const dots = document.querySelectorAll('.c-dot');
            startAuto(slides, dots);
        }
    }, AUTO_RESUME_DELAY_MS);
}

/* ========================================= */
/* BUBBLES */
/* ========================================= */

function initBubbles() {
    const canvas = document.querySelector('.portal-bubbles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = document.querySelector('.archives_section');
    let animFrame;
    let bubbles = [];
    let particles = [];
    let isActive = false;
    let unregisterAnim = null;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (!isActive) {
                    isActive = true;
                    resize();
                    initParticles();
                    
                    // Register with centralized animation manager
                    unregisterAnim = registerAnimation(() => {
                        if (!isActive) return;
                        animate();
                    });
                }
            } else {
                isActive = false;
                if (unregisterAnim) {
                    unregisterAnim();
                    unregisterAnim = null;
                }
            }
        });
    }, { threshold: 0.05 });

    observer.observe(section);

    function resize() {
        const rect = section.getBoundingClientRect();
        // Cap backing store at 2560px to prevent explosion on large viewports
        const result = sizeCanvas(canvas, rect.width, rect.height);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
    }

    const debouncedResize = debounce(resize, 150);
    window.addEventListener('resize', debouncedResize);
    setTimeout(resize, RESIZE_BOOT_DELAY_MS);

    function initParticles() {
        bubbles = [];
        particles = [];
        const w = canvas.width;
        const h = canvas.height;

        for (let i = 0; i < BUBBLE_COUNT; i++) {
            bubbles.push({
                x: Math.random() * w, y: Math.random() * h,
                r: 1 + Math.random() * 4, speed: 0.15 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.008 + Math.random() * 0.015,
                wobbleAmp: 1 + Math.random() * 3,
                opacity: 0.05 + Math.random() * 0.2,
            });
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const isGold = Math.random() > 0.5;
            particles.push({
                x: Math.random() * w, y: Math.random() * h,
                r: 0.5 + Math.random() * 1.5,
                color: isGold ? '201, 168, 97' : '73, 146, 154',
                floatAmp: 3 + Math.random() * 10,
                floatSpeed: 0.003 + Math.random() * 0.008,
                phase: Math.random() * Math.PI * 2,
                opacity: 0, maxOpacity: 0.2 + Math.random() * 0.4,
                delay: Math.random() * 4,
            });
        }
    }

    function animate() {
        if (!isActive) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const h = canvas.height;
        const time = Date.now() / 1000;

        bubbles.forEach(b => {
            b.wobble += b.wobbleSpeed;
            b.y -= b.speed;
            if (b.y < -20) { b.y = h + 20; b.x = Math.random() * canvas.width; }
            b.x += Math.sin(b.wobble) * b.wobbleAmp * 0.15;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(73, 146, 154, ${b.opacity})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
            if (b.r > 2) {
                ctx.beginPath();
                ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.3, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200, 230, 240, ${b.opacity * 0.5})`;
                ctx.fill();
            }
        });

        particles.forEach(p => {
            if (time < p.delay) return;
            p.opacity = Math.min(p.maxOpacity, p.opacity + 0.008);
            const floatY = p.y + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            const alpha = p.opacity * (0.5 + 0.5 * Math.sin(time * 0.3 + p.phase));
            // Glow halo
            ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.1})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 5, 0, 6.2832);
            ctx.fill();
            // Main particle
            ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, 6.2832);
            ctx.fill();
        });
        // Animation loop managed by AnimationManager
    }

    // Register cleanup for bubbles
    cleanupRegistry.register(() => {
        isActive = false;
        if (unregisterAnim) {
            unregisterAnim();
            unregisterAnim = null;
        }
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
    });
}

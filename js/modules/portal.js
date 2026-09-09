/* ==========================================================================
   FILE: js/modules/portal.js
   DESCRIPTION: 3D portal carousel for the archives section: slide transforms, drag navigation, and water-open effects.
   ========================================================================== */

import { cleanupRegistry, debounce, sizeCanvas, bindHorizontalSwipe } from '../utils/helpers.js';
import { isWebGLAvailable } from '../utils/webgl_utils.js';
import { registerAnimation } from '../utils/animation_manager.js';
import { isModalResumeStagger, getModalResumeElapsed } from '../utils/modal_resume.js?v=2';
import { projects, getProjectSubtitle, getProjectCover, getProjectTitle, getCategories, getCategoryLabel, getFirstProjectOfCategory, getOrderedProjectIndices, applyImageFallback } from '../constants/projects.js?v=11';
import { getCurrentLang } from './language.js';
import { TWO_PI, DEBOUNCE_DELAY_MS, RESIZE_BOOT_DELAY_MS, INTERSECTION_THRESHOLD, PORTAL_MAX_PIXEL_RATIO } from '../constants/ui.js';

let modalOpenCallback = null;
let currentCenter = 0;
let autoTimer = null;
let isAutoCycling = false;
let isPaused = false;
let activeMainCategory = null;
let TOTAL_SLIDES = 0;
const AUTO_INTERVAL = 9000;         
const AUTO_RESUME_DELAY_MS = 8000;  
const BUBBLE_COUNT = 30;            
const PARTICLE_COUNT = 40;
const PORTAL_VORTEX_STEP_MS = 33;   


const SLIDE_OFFSET_X_PX = 520;      
const SLIDE_OFFSET_Z_PX = -80;      
const SLIDE_ROTATE_Y_DEG = 25;      
const SLIDE_SCALE_SIDE = 0.78;      
const SLIDE_SCALE_CENTER_Z_PX = 100;  
const SLIDE_SCALE_CENTER = 1.12;      
const SLIDE_HIDDEN_Z_PX = -200;       
const SLIDE_SCALE_HIDDEN = 0.65;      


const CATEGORY_TINTS = {
    gamedev:  [0.550, 0.750, 1.000], 
    coding:   [0.400, 0.850, 0.800], 
    "3d":     [0.700, 0.550, 0.900], 
    concept:  [0.450, 0.800, 0.550], 
    sound:    [1.000, 0.780, 0.400], 
    other:    [0.950, 0.400, 0.600]  
};


let tiltActive = false;
let tiltSlide = null;
let tiltInner = null;
let tiltShine = null;
let tiltAnimFrame = null;
const TILT_MAX_ANGLE = 14; 


function buildPortalSlides() {
    const carousel = document.querySelector('.portal-carousel');
    if (!carousel) return;

    
    carousel.querySelectorAll(':scope > .portal-slide').forEach(s => s.remove());

    const controls = carousel.querySelector('.carousel-controls');
    const lang = getCurrentLang();

    
    
    
    const orderedProjectIndices = getOrderedProjectIndices();

    orderedProjectIndices.forEach((projectIdx, slideIndex) => {
        const project = projects[projectIdx];
        if (!project) return;

        const slide = document.createElement('div');
        slide.className = 'portal-slide';
        
        slide.dataset.index = String(slideIndex);
        slide.dataset.project = String(projectIdx);

        const img = document.createElement('img');
        img.src = getProjectCover(projectIdx) || '';
        img.alt = getProjectTitle(projectIdx, lang) || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        
        if (project.coverFit === 'contain') img.classList.add('fit-contain');
        
        if (project.coverPosition) img.style.objectPosition = project.coverPosition;
        
        applyImageFallback(img, project.category);

        
        
        
        
        const visual = document.createElement('div');
        visual.className = 'portal-visual';
        visual.appendChild(img);
        slide.appendChild(visual);

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


export function initPortal(onOpenModal) {
    modalOpenCallback = onOpenModal;

    
    buildPortalSlides();

    
    buildMainCategoryTabs();

    initBubbles();
    initCarousel();
    setupTiltStructure();
    
    
    initVortexShader();
    vortexSyncOpen();

    
    syncMainCategoryTab();

    
    const catContainer = document.querySelector('.main-cat-tabs');
    if (catContainer) {
        catContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.main-cat-item');
            if (item && item.dataset.category) {
                navigateToMainCategory(item.dataset.category);
            }
        });
    }

    
    document.addEventListener('languageChanged', renderPortalLabels);
    document.addEventListener('languageChanged', () => {
        buildMainCategoryTabs();
        syncMainCategoryTab();
    });
}



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




function setupTiltStructure() {
    const slides = document.querySelectorAll('.portal-slide');
    slides.forEach(slide => {
        
        if (slide.querySelector('.tilt-inner')) return;

        
        const img = slide.querySelector('img');
        if (!img) return;

        
        const tiltInner = document.createElement('div');
        tiltInner.className = 'tilt-inner';

        
        img.parentNode.insertBefore(tiltInner, img);
        tiltInner.appendChild(img);

        
        const shine = document.createElement('div');
        shine.className = 'tilt-shine';
        tiltInner.appendChild(shine);
    });
}


function attachTilt() {
    detachTilt(); 

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


function detachTilt() {
    if (tiltSlide) {
        tiltSlide.removeEventListener('mousemove', onTiltMove);
        tiltSlide.removeEventListener('mouseleave', onTiltLeave);
        tiltSlide.removeEventListener('mouseenter', onTiltEnter);
tiltSlide.removeEventListener('focusin', onPortalFocusIn);
        tiltSlide.removeEventListener('focusout', onPortalFocusOut);
    }

    
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

function onPortalFocusIn() {
    const inst = vortexInstances.find(i => i.slide === tiltSlide);
    if (inst) inst.openTarget = 1;
}


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

    
    let normX = (e.clientX - centerX) / (rect.width / 2);
    let normY = (e.clientY - centerY) / (rect.height / 2);

    
    normX = Math.max(-1, Math.min(1, normX));
    normY = Math.max(-1, Math.min(1, normY));

    
    const rotY = normX * TILT_MAX_ANGLE;
    const rotX = -normY * TILT_MAX_ANGLE;

    
    tiltInner.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

    
    const px = ((normX + 1) / 2) * 100; 
    const py = ((normY + 1) / 2) * 100; 
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

        
        vec2 center = vec2(0.5, 0.5) + vec2(sin(t * 0.21) * 0.012, cos(t * 0.27) * 0.012);
        vec2 p = (vUv - center) * vec2(aspect, 1.0);

        float r = length(p);
        float ang = atan(p.y, p.x);

        
        vec3 deep = vec3(0.006, 0.028, 0.052);
        vec3 body = vec3(0.022, 0.110, 0.150);
        vec3 teal = vec3(0.052, 0.270, 0.305);
        vec3 aqua = vec3(0.170, 0.540, 0.560);
        vec3 foam = vec3(0.730, 0.945, 0.960);

        
        float spin    = 0.20 + open * 0.55;
        float winding = 3.40 - open * 2.10;

        
        vec2 swirlBase = vec2(cos(ang), sin(ang)) * (0.8 + r * 3.0);
        float turb = fbm(swirlBase * 0.85 + vec2(t * 0.11, -t * 0.08)) - 0.5;

        float spiral = ang + t * spin + r * winding + turb * 1.7;

        
        float funnelR = 0.15 + open * 0.50;
        float funnel  = smoothstep(funnelR, 0.02, r);
        vec3 col = mix(body, deep, funnel);

        
        float rings = sin(r * 26.0 - t * 1.05 + spiral * 2.0 + turb * 4.0);
        col += teal * (0.5 + 0.5 * rings) * 0.13 * (1.0 - r * 0.6);

        
        float cq = fbm(vec2(cos(spiral), sin(spiral)) * 3.4 + vec2(r * 8.0 - t * 0.7, t * 0.5));
        float caustic = smoothstep(0.52, 0.80, cq);
        col += aqua * caustic * 0.32;
        col += foam * caustic * 0.10;

        
        float c1 = smoothstep(0.045, 0.0, abs(r - (0.24 + 0.020 * sin(t * 0.7)  + turb * 0.05)));
        float c2 = smoothstep(0.070, 0.0, abs(r - (0.44 + 0.028 * sin(t * 0.45 + 2.0) + turb * 0.06)));
        col += aqua * (c1 * 0.42 + c2 * 0.20);
        col += foam * (c1 * 0.24 + c2 * 0.09);

        
        float throat = exp(-r * 7.5);
        col += aqua * throat * 0.60;
        col += foam * throat * 0.10 * (0.5 + 0.5 * sin(t * 1.3));

        
        float sp = noise(vec2(cos(spiral) * 5.0 + t * 0.18, r * 4.0 - t * 0.7));
        float sparkle = pow(sp, 16.0);
        col += foam * sparkle * 0.30;

        
        vec3 tint = uCategoryTint;
        float lumA = dot(col, vec3(0.2126, 0.7152, 0.0722));
        vec3 tinted = mix(col, tint, 0.5);   
        float lumB = dot(tinted, vec3(0.2126, 0.7152, 0.0722));
        col = tinted * (lumA / max(lumB, 0.0001));   

        
        
        
        float vignette = 1.0 - smoothstep(0.40, 0.66, r);
        col *= 0.60 + 0.40 * vignette;

        
        
        
        
        float edgeGlow  = smoothstep(0.30, 0.48, r) * (1.0 - smoothstep(0.52, 0.72, r));
        
        
        
        
        
        vec2  qRect       = abs(vUv - vec2(0.5)) * 2.0;   
        float cornerSolid = smoothstep(0.52, 0.62, r);
        float frameSolid  = max(
            smoothstep(0.925, 0.995, qRect.x),                     
            smoothstep(0.925, 0.995, qRect.y) * step(0.5, vUv.y)   
        );
        float openBorder = max(0.75 * edgeGlow, max(cornerSolid, frameSolid));
        
        
        
        float ringBoost = 0.35 + 0.65 * edgeGlow + 0.55 * throat;
        col = mix(col, uCategoryTint * (0.85 + 0.40 * caustic), uFlash * 0.45);
        col += uCategoryTint * uFlash * 0.50 * ringBoost;

        
        
        float alpha = mix(1.0, openBorder, open);
        gl_FragColor = vec4(col, alpha);

    }
`;

let vortexInstances = [];
let vortexUnregisterAnim = null;
let vortexSectionVisible = true;


function createVortexInstance(slide) {
    const THREE = window.THREE;
    if (!THREE || !slide) return null;

    
    
    
    
    if (!isWebGLAvailable()) return null;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true, antialias: true, powerPreference: 'high-performance'
        });
    } catch (e) {
        
        console.warn('[portal-vortex] WebGL context creation failed, slide stays image-visible.', e);
        return null;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, PORTAL_MAX_PIXEL_RATIO);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.className = 'portal-vortex-canvas';
    
    
    
    
    
    
    
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

    
    
    const visual = slide.querySelector('.portal-visual') || slide;
    visual.appendChild(canvas);

    function size() {
        const w = visual.clientWidth || 1;
        const h = visual.clientHeight || 1;
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

    
    slide.addEventListener('mouseenter', () => { inst.flashV = 1; }, { passive: true });

    vortexInstances.push(inst);
    return inst;
}


function initVortexShader() {
    if (vortexInstances.length) return;

    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[portal-vortex] Three.js not loaded - no vortex medallions.');
        return;
    }
    let reduced = false;
    try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) {  }
    if (reduced) return; 

    
    
    
    
    const section = document.querySelector('.archives_section');
    if (section && typeof IntersectionObserver !== 'undefined') {
        const lazyObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                lazyObserver.disconnect();
                createPortalVortices();
            }
        }, { rootMargin: '800px 0px', threshold: 0 });
        lazyObserver.observe(section);
        return;
    }

    
    createPortalVortices();
}


function createPortalVortices() {
    if (vortexInstances.length) return; 

    document.querySelectorAll('.portal-slide').forEach(createVortexInstance);
    if (!vortexInstances.length) return;

    vortexUnregisterAnim = registerAnimation((now, dt) => {
        const delta = dt || 1 / 60;
        vortexInstances.forEach((inst, idx) => {
            if (!vortexSectionVisible) return;
            
            
            if (document.body.classList.contains('modal-open')) return;
            
            
            
            
            const resumeElapsed = getModalResumeElapsed();
            if (resumeElapsed >= 0 && resumeElapsed < idx * PORTAL_VORTEX_STEP_MS) return;
            if (!inst.canvas.isConnected) return;
            
            if (inst.slide.classList.contains('pos-hidden')) return;
            inst.uniforms.uTime.value += delta;
            const ease = 1 - Math.exp(-delta * 3.5);
            inst.uniforms.uOpen.value += (inst.openTarget - inst.uniforms.uOpen.value) * ease;
            
            if (inst.flashV > 0.002) {
                inst.flashV *= Math.exp(-delta * 3.4);
            } else {
                inst.flashV = 0;
            }
            inst.uniforms.uFlash.value = inst.flashV;
            inst.renderer.render(inst.scene, inst.camera);
        });
    });

    const visSection = document.querySelector('.archives_section');
    if (visSection) {
        const obs = new IntersectionObserver((entries) => {
            vortexSectionVisible = entries[0].isIntersecting;
        }, { threshold: INTERSECTION_THRESHOLD });
        obs.observe(visSection);
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


function vortexSyncOpen() {
    document.querySelectorAll('.portal-slide').forEach(slide => {
        const inst = vortexInstances.find(i => i.slide === slide);
        if (inst) {
            inst.openTarget = slide.classList.contains('pos-center') ? 1 : 0;
        }
    });
}


function initCarousel() {
    const slides = document.querySelectorAll('.portal-slide');
    const dots = document.querySelectorAll('.c-dot');
    const prevBtn = document.querySelector('.carousel-prev');
    const nextBtn = document.querySelector('.carousel-next');
    const section = document.querySelector('.archives_section');

    if (slides.length === 0) return;

    
    if (prevBtn) prevBtn.setAttribute('aria-label', 'Previous slide');
    if (nextBtn) nextBtn.setAttribute('aria-label', 'Next slide');

    
    TOTAL_SLIDES = slides.length;

    let cleanupListeners = [];

    
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

    
    slides.forEach((slide, i) => {
        slide.setAttribute('role', 'button');
        slide.setAttribute('tabindex', '0');
        slide.setAttribute('aria-label', `Project ${i + 1} of ${TOTAL_SLIDES}`);
    });

    
    updatePositions(slides, dots);

    
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

    
    slides.forEach((slide) => {
        const onSlideClick = (e) => {
            const idx = parseInt(slide.dataset.index);

            if (idx === currentCenter) {
                
                e.preventDefault();
                e.stopPropagation();
                pauseAuto();
                if (modalOpenCallback) {
                    modalOpenCallback(slide);
                } else {
                    
                }
                return;
            }

            
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

    
    function onModalClose() {
        setTimeout(() => {
            isPaused = false;
            resumeAutoAfterDelay();
        }, 200);
    }

    
    const onEscKey = (e) => {
        if (e.key === 'Escape') onModalClose();
    };
    document.addEventListener('keydown', onEscKey);
    cleanupListeners.push(() => document.removeEventListener('keydown', onEscKey));

    
    const overlay = document.querySelector('.project_modal_overlay');
    if (overlay) {
        const onOverlayClick = (e) => {
            if (e.target === overlay) onModalClose();
        };
        overlay.addEventListener('click', onOverlayClick);
        cleanupListeners.push(() => overlay.removeEventListener('click', onOverlayClick));
    }

    
    const closeBtn = document.querySelector('.modal_close_btn');
    if (closeBtn) {
        const onCloseClick = () => onModalClose();
        closeBtn.addEventListener('click', onCloseClick);
        cleanupListeners.push(() => closeBtn.removeEventListener('click', onCloseClick));
    }

    
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
    
    
    slides.forEach((slide) => {
        slide.classList.remove('pos-center', 'pos-left', 'pos-right', 'pos-hidden');
    });

    
    void document.body.offsetHeight;

    slides.forEach((slide, i) => {
        
        let rel = i - currentCenter;
        if (rel < -1) rel += TOTAL_SLIDES;
        if (rel > 1) rel -= TOTAL_SLIDES;

        
        
        if (rel === 0) {
            
            slide.classList.add("pos-center");
            slide.setAttribute("aria-current", "true");
            slide.style.transform = `translateX(0) translateZ(${SLIDE_SCALE_CENTER_Z_PX}px) scale(${SLIDE_SCALE_CENTER})`;
            slide.style.opacity = '1';
            
            slide.style.pointerEvents = '';
        } else if (rel === -1 || rel === 1) {
            
            slide.classList.add("pos-" + (rel === -1 ? "left" : "right"));
            slide.setAttribute("aria-current", "false");
            slide.style.transform = `translateX(${rel === -1 ? -SLIDE_OFFSET_X_PX : SLIDE_OFFSET_X_PX}px) translateZ(${SLIDE_OFFSET_Z_PX}px) rotateY(${rel === -1 ? SLIDE_ROTATE_Y_DEG : -SLIDE_ROTATE_Y_DEG}deg) scale(${SLIDE_SCALE_SIDE})`;
            slide.style.opacity = '0.7';
            
            slide.style.pointerEvents = '';
        } else {
            
            
            slide.classList.add("pos-hidden");
            slide.style.opacity = '0';
            slide.style.pointerEvents = 'none';
            slide.style.transform = `translateX(0) translateZ(${SLIDE_HIDDEN_Z_PX}px) scale(${SLIDE_SCALE_HIDDEN})`;
        }
    });

    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentCenter);
        dot.setAttribute('aria-label', `Go to project ${i + 1}`);
        if (i === currentCenter) {
            dot.setAttribute('aria-current', 'true');
        } else {
            dot.removeAttribute('aria-current');
        }
    });

    
    syncMainCategoryTab();
    
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            attachTilt();
        });
    });
    
    vortexSyncOpen();
}



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



function initBubbles() {
    const canvas = document.querySelector('.portal-bubbles-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const section = document.querySelector('.archives_section');
    
    
    if (!section) return;
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
                    
                    
                    unregisterAnim = registerAnimation(() => {
                        if (!isActive) return;
                        if (document.body.classList.contains('modal-open') || isModalResumeStagger(1)) return;
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
    }, { threshold: INTERSECTION_THRESHOLD });

    observer.observe(section);

    function resize() {
        
        
        
        const w = section.offsetWidth;
        const h = section.offsetHeight;
        if (w === 0 || h === 0) return; 
        
        sizeCanvas(canvas, w, h);
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
    }

    const debouncedResize = debounce(resize, DEBOUNCE_DELAY_MS);
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
            
            ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.1})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 5, 0, TWO_PI);
            ctx.fill();
            
            ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, TWO_PI);
            ctx.fill();
        });
        
    }

    
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

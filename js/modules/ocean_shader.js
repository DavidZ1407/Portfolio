/**
 * File: ocean_shader.js
 * Description: WebGL ocean/caustics shader background for the hero section.
 */
import { cleanupRegistry } from '../utils/helpers.js';
import { isWebGLAvailable } from '../utils/webgl_utils.js';
import { INTERSECTION_THRESHOLD, FRAME_TIMESTEP, SHADER_MAX_PIXEL_RATIO } from '../constants/ui.js';

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const fragmentShader = `
    precision highp float;
    uniform float uTime;

    varying vec2 vUv;

    float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }
    float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),
                   mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
    }
    float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
        return v;
    }

    void main() {
        vec2 uv = vUv;
        float t = uTime;

        // ---- Colors ----
        vec3 deepWater = vec3(0.008, 0.025, 0.045);
        vec3 midWater  = vec3(0.02,  0.06,  0.11);
        vec3 surfColor = vec3(0.15, 0.42, 0.48);
        vec3 rayColor  = vec3(0.12, 0.38, 0.42);
        vec3 brightRay = vec3(0.35, 0.65, 0.72);

        // ---- Water surface (top) ----
        // No hard line - instead a soft light refraction at the surface
        float surfaceZone = smoothstep(0.85, 1.0, uv.y);
        
        // Animated wave distortion at the surface (like caustic patterns from below)
        float wave1 = fbm(vec2(uv.x * 5.0, t * 0.15)) * 0.12;
        float wave2 = fbm(vec2(uv.x * 8.0 - t * 0.1, t * 0.1)) * 0.08;
        float surfaceDistortion = wave1 + wave2;

        // ---- Brightness gradient (bright top, dark bottom) ----
        float depth = 1.0 - uv.y;
        float brightness = exp(-depth * 2.5);

        vec3 color = mix(deepWater, midWater, brightness);

        // ---- Surface: animated light refraction (no line) ----
        // Water reflections breaking in from above
        float refraction = surfaceZone * 0.7;
        float causticSurface = fbm(vec2(uv.x * 4.0 + surfaceDistortion, t * 0.2));
        causticSurface = smoothstep(0.3, 0.7, causticSurface);
        color += surfColor * refraction * causticSurface * 0.3;

        // Soft glow right below the surface (no hard edge)
        float surfGlow = surfaceZone * surfaceZone;
        color += brightRay * surfGlow * 0.15;

        // ---- God rays (light beams from top to bottom) ----
        float rays = 0.0;
        for (int i = 0; i < 6; i++) {
            float fi = float(i);
            // Each ray has its own position and speed
            float rayX = 0.15 + fi * 0.14 + sin(t * 0.08 + fi * 1.7) * 0.04;
            float width = 0.006 + sin(t * 0.12 + fi * 2.3) * 0.002;
            
            // Distance from the current pixel to the ray axis
            float d = abs(uv.x - rayX);
            float ray = smoothstep(width, 0.0, d);
            
            // Ray gets weaker toward the bottom
            ray *= smoothstep(0.0, 0.3, uv.y);
            ray *= exp(-(1.0 - uv.y) * 3.0);
            
            // Pulsating
            ray *= 0.5 + 0.5 * sin(t * 0.2 + fi * 1.1);
            
            rays += ray;
        }
        rays = clamp(rays, 0.0, 1.0);
        color += rayColor * rays * 0.6;
        color += brightRay * rays * 0.15;

        // ---- Caustics (light patterns on the floor = bottom) ----
        float c1 = fbm(uv * 4.0 + t * 0.06);
        float c2 = fbm(uv * 6.0 - t * 0.04 + 5.0);
        float caustic = c1 * c2;
        caustic = smoothstep(0.15, 0.5, caustic);
        // Caustics stronger at the bottom (where light hits the floor)
        float causticMask = (1.0 - uv.y) * uv.y * 4.0;
        causticMask = clamp(causticMask, 0.0, 1.0);
        color += rayColor * caustic * causticMask * 0.12;

        // ---- Small bubbles / particles ----
        vec2 buv = uv * 15.0 + vec2(0.0, t * 0.05);
        vec2 bg = floor(buv);
        float bh = hash(bg);
        if (bh > 0.85) {
            vec2 bf = fract(buv) - 0.5;
            float bd = length(bf);
            float life = sin(t * (0.4 + bh) + bh * 10.0) * 0.5 + 0.5;
            float bubble = smoothstep(0.06, 0.02, bd) * life;
            float bAlpha = bubble * (1.0 - uv.y) * 0.4;
            color += brightRay * bAlpha;
        }

        // ---- Vignette ----
        float vig = 1.0 - length(uv - vec2(0.5, 0.5)) * 0.4;
        color *= vig;

        gl_FragColor = vec4(color, 1.0);
    }
`;

export function initHeroShader() {
    const heroSection = document.querySelector('.hero_section');
    if (!heroSection) return;

    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[hero-shader] Three.js not loaded.');
        return;
    }

    const oldCanvas = heroSection.querySelector('.hero-shader-canvas');
    if (oldCanvas) oldCanvas.remove();

    // Skip WebGL entirely on unsupported devices instead of letting THREE
    // throw "Error creating WebGL context" - the hero keeps its CSS layers,
    // so the design stays intact without any GPU work.
    if (!isWebGLAvailable()) {
        console.warn('[hero-shader] WebGL unavailable - hero keeps static background.');
        return;
    }

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    scene.background = null;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance'
        });
    } catch (e) {
        // Context creation can still fail on blacklisted GPUs - degrade to CSS.
        console.warn('[hero-shader] WebGL context creation failed - hero keeps static background.', e);
        return;
    }
    renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);
    // Cap pixel ratio to prevent excessive GPU load at very large viewports
    const pixelRatio = Math.min(window.devicePixelRatio, SHADER_MAX_PIXEL_RATIO);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.className = 'hero-shader-canvas';
    renderer.domElement.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 0;
        pointer-events: none;
    `;

    const heroSceneEl = heroSection.querySelector('.hero_scene');
    if (heroSceneEl) {
        heroSection.insertBefore(renderer.domElement, heroSceneEl.nextSibling);
    } else {
        heroSection.prepend(renderer.domElement);
    }

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    window.addEventListener('resize', () => {
        renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);
    }, { passive: true });

    let animFrame = null;
    let isActive = true;
    let isVisible = true;

    function animate() {
        if (!isActive) { animFrame = requestAnimationFrame(animate); return; }
        // Pause GPU rendering while the project modal is open: the hero sits
        // behind the dark overlay, so rendering would burn GPU for zero visibility.
        if (document.body.classList.contains('modal-open')) { animFrame = requestAnimationFrame(animate); return; }
        // Skip GPU rendering while the hero section is off-screen
        if (!isVisible) { animFrame = requestAnimationFrame(animate); return; }
        material.uniforms.uTime.value += FRAME_TIMESTEP;
        renderer.render(scene, camera);
        animFrame = requestAnimationFrame(animate);
    }

    animFrame = requestAnimationFrame(animate);

    // Pause the hero shader when not visible (like particle_rain.js)
    const heroObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: INTERSECTION_THRESHOLD });
    heroObserver.observe(heroSection);

    cleanupRegistry.register(() => {
        heroObserver.disconnect();
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        renderer.dispose();
        renderer.domElement.remove();
    });
}
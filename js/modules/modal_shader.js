/**
 * File: modal_shader.js
 * Description: WebGL Voronoi shader background for the project modal, tinted per project category color.
 */
import { cleanupRegistry } from '../utils/helpers.js';
import { FRAME_TIMESTEP, SHADER_MAX_PIXEL_RATIO } from '../constants/ui.js';

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
    uniform vec2 uResolution;
    uniform float uColorScheme;

    varying vec2 vUv;

    #define tau 6.28318530718

    float sin01(float x) {
        return (sin(x * tau) + 1.0) / 2.0;
    }

    float cos01(float x) {
        return (cos(x * tau) + 1.0) / 2.0;
    }

    vec2 rand01(vec2 p) {
        vec3 a = fract(p.xyx * vec3(123.5, 234.34, 345.65));
        a += dot(a, a + 34.45);
        return fract(vec2(a.x * a.y, a.y * a.z));
    }

    float circ(vec2 uv, vec2 pos, float r) {
        return smoothstep(r, 0.0, length(uv - pos));
    }

    float distFn(vec2 from, vec2 to) {
        float x = length(from - to);
        return pow(x, 4.0);
    }

    float voronoi(vec2 uv, float t, float seed, float size) {
        float minDist = 100.0;
        float gridSize = size;
        vec2 cellUv = fract(uv * gridSize) - 0.5;
        vec2 cellCoord = floor(uv * gridSize);

        for (float x = -1.0; x <= 1.0; ++x) {
            for (float y = -1.0; y <= 1.0; ++y) {
                vec2 cellOffset = vec2(x, y);
                vec2 rand01Cell = rand01(cellOffset + cellCoord + seed);
                vec2 point = cellOffset + sin(rand01Cell * (t + 10.0)) * 0.5;
                float dist = distFn(cellUv, point);
                minDist = min(minDist, dist);
            }
        }
        return minDist;
    }

    void main() {
        vec2 fragCoord = vUv * uResolution;
        vec2 uv = (2.0 * fragCoord - uResolution.xy) / uResolution.y;

        float t = uTime * 0.35;

        float amplitude = 0.12;
        float turbulence = 0.5;
        uv.xy += sin01(uv.x * turbulence + t) * amplitude;
        uv.xy -= sin01(uv.y * turbulence + t) * amplitude;

        float v;
        float sizeDistortion = abs(uv.x) / 3.0;
        v += voronoi(uv, t * 2.0, 0.5, 2.5 - sizeDistortion);
        v += voronoi(uv, t * 4.0, 0.0, 4.0 - sizeDistortion) / 2.0;

        // Color schemes (one per category), index = getCategorySchemeIndex(category)
        // 0=gamedev(blue), 1=coding(teal), 2=3d(purple/indigo),
        // 3=concept(green/emerald), 4=sound(amber/gold), 5=other(rose)
        vec3 fgColor;
        vec3 bgColor;

        if (uColorScheme < 1.0) {
            // Scheme 0 - Game Dev (deep blue)
            fgColor = vec3(0.55, 0.75, 1.0);
            bgColor = vec3(0.0, 0.3, 0.5);
        } else if (uColorScheme < 2.0) {
            // Scheme 1 - Coding (teal/cyan)
            fgColor = vec3(0.4, 0.85, 0.8);
            bgColor = vec3(0.0, 0.35, 0.4);
        } else if (uColorScheme < 3.0) {
            // Scheme 2 - 3d (purple/indigo)
            fgColor = vec3(0.7, 0.55, 0.9);
            bgColor = vec3(0.15, 0.1, 0.3);
        } else if (uColorScheme < 4.0) {
            // Scheme 3 - Concept (green/emerald)
            fgColor = vec3(0.45, 0.8, 0.55);
            bgColor = vec3(0.05, 0.25, 0.15);
        } else if (uColorScheme < 5.0) {
            // Scheme 4 - Sound (amber/gold warm)
            fgColor = vec3(1.0, 0.78, 0.4);
            bgColor = vec3(0.35, 0.22, 0.05);
        } else {
            // Scheme 5 - Other (rose/magenta)
            fgColor = vec3(0.95, 0.4, 0.6);
            bgColor = vec3(0.3, 0.05, 0.18);
        }
        
        vec3 col = v * fgColor;
        col += (1.0 - v) * bgColor;

        // Muted water atmosphere: darkened + semi-transparent so the
        // dark navy gradient (modal-bg-*) shows through and the
        // Voronoi shader only forms a subtle, atmospheric layer.
        col *= 0.5;
        gl_FragColor = vec4(col, 0.62);
    }
`;

export function initModalShader(container) {
    if (!container) return null;

    const THREE = window.THREE;
    if (!THREE) {
        console.warn('[modal_shader] Three.js not loaded.');
        return null;
    }

    const oldCanvas = container.querySelector('.modal_shader_canvas');
    if (oldCanvas) oldCanvas.remove();

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const scene = new THREE.Scene();
    scene.background = null;

    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Cap pixel ratio to prevent excessive GPU load at very large viewports
    const pixelRatio = Math.min(window.devicePixelRatio, SHADER_MAX_PIXEL_RATIO);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);

    renderer.domElement.className = 'modal_shader_canvas';
    renderer.domElement.style.cssText = `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: 1;
        pointer-events: none;
        border-radius: inherit;
    `;

    container.prepend(renderer.domElement);

    let currentColorScheme = 0;

    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: [container.clientWidth, container.clientHeight] },
        uColorScheme: { value: currentColorScheme }
    };

    const material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
    });

    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

    let animFrame = null;
    let isActive = false;

    function resize() {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w > 0 && h > 0) {
            renderer.setSize(w, h);
            uniforms.uResolution.value = [w, h];
        }
    }

    function animate() {
        if (!isActive) {
            animFrame = requestAnimationFrame(animate);
            return;
        }
        uniforms.uTime.value += FRAME_TIMESTEP;
        renderer.render(scene, camera);
        animFrame = requestAnimationFrame(animate);
    }

    const resizeObserver = new ResizeObserver(() => {
        if (isActive) resize();
    });
    resizeObserver.observe(container);

    function setColorScheme(scheme) {
        currentColorScheme = scheme;
        uniforms.uColorScheme.value = scheme;
    }

    function start(scheme) {
        // Update the color even while the shader is running
        if (scheme !== undefined) setColorScheme(scheme);
        if (isActive) return;
        isActive = true;
        resize();
        if (!animFrame) {
            animFrame = requestAnimationFrame(animate);
        }
    }

    function stop() {
        isActive = false;
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
    }

    function destroy() {
        stop();
        resizeObserver.disconnect();
        renderer.dispose();
        renderer.domElement.remove();
    }

    cleanupRegistry.register(() => {
        destroy();
    });

    return { start, stop, destroy, setColorScheme };
}
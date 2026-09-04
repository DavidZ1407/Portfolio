/**
 * File: water_logo.js
 * Description: WebGL water-effect canvas rendering the AETHERTECH logo text in the hero.
 */
import { cleanupRegistry, waitForFont } from '../utils/helpers.js';
import { MOBILE_BREAKPOINT, LARGE_BREAKPOINT_PX, MOBILE_SMALL_BREAKPOINT_PX, INTERSECTION_THRESHOLD } from '../constants/ui.js';

/* ---- Canvas text sizes (screen-dependent) ---- */
const LOGO_TEXT_WIDTH_DEFAULT = 600;   // desktop default width of the text canvas (px)
const LOGO_TEXT_HEIGHT_DEFAULT = 120;  // desktop default height of the text canvas (px)
const LOGO_TEXT_HEIGHT_RATIO = 0.2;    // height as a fraction of the width (mobile/tablet)
const LOGO_TEXT_WIDTH_MIN = 180;       // absolute minimum width (smallest screens)
const LOGO_TEXT_VIEWPORT_FRACTION = 0.85;     // width fraction of the viewport (smallest screens)
const LOGO_TEXT_VIEWPORT_FRACTION_TABLET = 0.7; // width fraction of the viewport (tablet)
const LOGO_TEXT_WIDTH_LARGE = 1200;    // large screens (>2056px)
const LOGO_TEXT_HEIGHT_LARGE = 240;    // large screens (>2056px)

const vertSrc = `#version 300 es
in vec2 aPosition;
in vec2 aTexcoord;
out vec2 vTexcoord;
void main() {
    vTexcoord = aTexcoord;
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragSrc = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform float uTime;
in vec2 vTexcoord;
out vec4 fragColor;

void main() {
    vec2 uv = vTexcoord;

    // Water base colors
    vec3 deepBlue = vec3(0.0, 0.05, 0.2);
    vec3 midWater = vec3(0.0, 0.25, 0.45);
    vec3 shallowWater = vec3(0.05, 0.55, 0.65);
    vec3 foamColor = vec3(0.7, 0.9, 0.95);

    // Water UV distortion (for water visual only, NOT for text sampling)
    float wave1 = sin(uv.x * 40.0 + uTime * 1.8) * cos(uv.y * 35.0 + uTime * 1.2);
    float wave2 = sin(uv.x * 60.0 + uv.y * 50.0 + uTime * 2.5);
    float wave3 = cos(uv.x * 25.0 - uv.y * 30.0 + uTime * 1.0);
    float wave4 = sin((uv.x + uv.y) * 45.0 + uTime * 3.2);

    float distortStrength = 0.008;
    vec2 waterUV = uv + vec2(
        wave1 * distortStrength + wave2 * distortStrength * 0.5,
        wave3 * distortStrength + wave4 * distortStrength * 0.5
    );

    // Waves for water color
    float dWave1 = sin(waterUV.x * 40.0 + uTime * 1.8) * cos(waterUV.y * 35.0 + uTime * 1.2);
    float dWave2 = sin(waterUV.x * 55.0 + waterUV.y * 45.0 + uTime * 2.5);
    float dWave3 = cos(waterUV.x * 20.0 - waterUV.y * 25.0 + uTime * 1.0);
    float dWave4 = sin((waterUV.x + waterUV.y) * 40.0 + uTime * 3.2);

    float combinedWaves = dWave1 * 0.35 + dWave2 * 0.3 + dWave3 * 0.2 + dWave4 * 0.15;
    float waveHeight = combinedWaves * 0.5 + 0.5;

    // Water color
    vec3 waterColor = mix(deepBlue, midWater, waveHeight * 1.3);
    waterColor = mix(waterColor, shallowWater, max(0.0, waveHeight * 1.5 - 0.5));

    // Foam on wave crests
    float foam = smoothstep(0.6, 0.95, waveHeight);
    foam += smoothstep(0.65, 1.0, abs(dWave1 * 0.5 + 0.5)) * 0.25;
    waterColor = mix(waterColor, foamColor, foam * 0.4);

    // Specular shimmer (water highlights only)
    float shimmer = sin(waterUV.x * 100.0 + waterUV.y * 80.0 + uTime * 5.0) * 0.5 + 0.5;
    float spec = shimmer * 0.35;
    waterColor += spec * vec3(1.0, 0.95, 0.8) * 0.4;

    // Caustics (water light patterns)
    float caustic1 = sin(waterUV.x * 25.0 + waterUV.y * 15.0 + uTime * 2.0);
    float caustic2 = sin(waterUV.x * 35.0 - waterUV.y * 20.0 + uTime * 1.5);
    float caustic = caustic1 * caustic2 * 0.5 + 0.5;

    // Text texture - sampled with MINIMAL distortion for readability
    float textDistort = 0.003;
    vec2 textUV = uv + vec2(
        wave1 * textDistort + wave2 * textDistort * 0.3,
        wave3 * textDistort + wave4 * textDistort * 0.3
    );
    vec4 texColor = texture(uTexture, textUV);

    // Keep text bright and readable - water effect as subtle overlay only
    vec3 finalColor = texColor.rgb;

    // Gentle brightness ripple - text stays bright (range 0.85-1.0)
    finalColor *= (0.88 + waveHeight * 0.12);

    // Subtle light caustics on text (very faint)
    finalColor += caustic * vec3(0.25, 0.55, 0.65) * 0.06;

    // Subtle specular highlights on text (very faint)
    finalColor += spec * vec3(1.0, 0.97, 0.9) * 0.08;

    // Very light water color tint - text stays white/bright
    finalColor = mix(finalColor, finalColor * (waterColor + 0.6), 0.18);

    float alpha = texColor.a;
    fragColor = vec4(finalColor, alpha);
}`;

// Full CSS font shorthand used for the logo texture. Shared by the canvas rasterizer
// and the font-loading wait, so the waiter always targets the exact same face.
function getLogoFont(h) {
    return `bold ${Math.round(h * 0.55)}px Cinzel, serif`;
}

function createTextCanvas(text, w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    // Fit the font dynamically to the canvas size
    ctx.font = getLogoFont(h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    return c;
}

export function initWaterLogo() {
    const heroContent = document.querySelector('.hero_content');
    if (!heroContent) return;

    const h1 = heroContent.querySelector('h1');
    if (!h1) return;

    // Hide the h1 and place the canvas next to it
    h1.style.opacity = '0';
    h1.style.position = 'relative';

    const container = document.createElement('div');
    container.className = 'water-text-container';
    container.style.cssText = `
        display: flex;
        justify-content: center;
        margin-bottom: 0;
        position: relative;
    `;

    const canvas = document.createElement('canvas');
    canvas.className = 'water-text-canvas';
    // Dynamic size: on small screens, oriented to the viewport
    const vw = window.innerWidth;
    let textWidth = LOGO_TEXT_WIDTH_DEFAULT;
    let textHeight = LOGO_TEXT_HEIGHT_DEFAULT;
    if (vw <= MOBILE_SMALL_BREAKPOINT_PX) {
        textWidth = Math.max(LOGO_TEXT_WIDTH_MIN, Math.round(vw * LOGO_TEXT_VIEWPORT_FRACTION));
        textHeight = Math.round(textWidth * LOGO_TEXT_HEIGHT_RATIO);
    } else if (vw <= MOBILE_BREAKPOINT) {
        textWidth = Math.min(vw * LOGO_TEXT_VIEWPORT_FRACTION_TABLET, LOGO_TEXT_WIDTH_DEFAULT);
        textHeight = Math.round(textWidth * LOGO_TEXT_HEIGHT_RATIO);
    } else if (vw > LARGE_BREAKPOINT_PX) {
        textWidth = LOGO_TEXT_WIDTH_LARGE;
        textHeight = LOGO_TEXT_HEIGHT_LARGE;
    }
    canvas.width = textWidth;
    canvas.height = textHeight;
    canvas.style.cssText = `
        width: ${textWidth}px;
        height: ${textHeight}px;
        max-width: 100%;
    `;

    container.appendChild(canvas);
    heroContent.insertBefore(container, h1);

    // WebGL setup
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn('[water-logo] WebGL2 not supported');
        container.remove();
        h1.style.opacity = '1';
        return;
    }

    // Handle context loss: the browser may reclaim the WebGL context under
    // memory pressure (especially on mobile). Prevent default to allow
    // restoration, then fall back to the static h1 text.
    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.warn('[water-logo] WebGL context lost - falling back to static text.');
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        container.remove();
        h1.style.opacity = '1';
    }, { once: true });

    // Compile shaders
    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('[water-logo] Shader error:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) { container.remove(); h1.style.opacity = '1'; return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('[water-logo] Link error:', gl.getProgramInfoLog(prog));
        container.remove();
        h1.style.opacity = '1';
        return;
    }
    gl.useProgram(prog);

    // Fullscreen quad - flip Y for texture (canvas 2D origin is top-left)
    const verts = new Float32Array([-1,-1, 0,1, 1,-1, 1,1, -1,1, 0,0, 1,1, 1,0]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'aPosition');
    const aTex = gl.getAttribLocation(prog, 'aTexcoord');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    // Text as texture
    const textCanvas = createTextCanvas('DAVID ZAHN', textWidth, textHeight);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    gl.viewport(0, 0, textWidth, textHeight);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Animate
    let animFrame = null;
    let isActive = true;
    let isVisible = true;
    let startTime = performance.now();

    function render() {
        if (!isActive) return;
        // Item 4: skip WebGL rendering while the logo is off-screen
        if (!isVisible) { animFrame = requestAnimationFrame(render); return; }
        // Skip drawing while the project modal covers the hero (no visual benefit).
        if (document.body.classList.contains('modal-open')) { animFrame = requestAnimationFrame(render); return; }
        const t = (performance.now() - startTime) / 1000.0;
        gl.uniform1f(uTime, t);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animFrame = requestAnimationFrame(render);
    }

    animFrame = requestAnimationFrame(render);

    // The Google Font arrives asynchronously, so the first texture may have
    // been rasterized with the fallback serif face. Redraw the texture in-place
    // once Cinzel is ready - without this the wrong glyphs would stay in the
    // texture for the whole session (canvas textures are never redrawn automatically).
    waitForFont(getLogoFont(textHeight)).then(() => {
        if (!isActive) return;
        const freshCanvas = createTextCanvas('DAVID ZAHN', textWidth, textHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, freshCanvas);
    }).catch(() => { /* font permanently unavailable - keep the first rendering */ });

    // Item 4: pause when not visible (like particle-rain.js)
    const heroObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: INTERSECTION_THRESHOLD });
    heroObserver.observe(container);

    cleanupRegistry.register(() => {
        heroObserver.disconnect();
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        container.remove();
        h1.style.opacity = '1';
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
    });
}
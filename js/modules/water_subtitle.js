/* ========================================= */
/* MODULE - WATER SUBTITLE (CYCLING TEXT)     */
/* Cycles through "Game Design", "Audio       */
/* Design", "3D Modeling", "animation",       */
/* "coding" with the same WebGL water shader  */
/* as the "DAVID ZAHN" logo.                  */
/* ========================================= */

import { cleanupRegistry } from '../utils/helpers.js';

const SUBTITLES = [
    'Game Design',
    'Audio Design',
    '3D Modeling',
    'animation',
    'coding'
];

// Reuse the same shaders from water-logo (slightly adapted for smaller text)
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
uniform float uFade;
in vec2 vTexcoord;
out vec4 fragColor;

void main() {
    vec2 uv = vTexcoord;

    // Water base colors
    vec3 deepBlue = vec3(0.0, 0.05, 0.2);
    vec3 midWater = vec3(0.0, 0.25, 0.45);
    vec3 shallowWater = vec3(0.05, 0.55, 0.65);
    vec3 foamColor = vec3(0.7, 0.9, 0.95);

    // Water UV distortion
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

    // Foam
    float foam = smoothstep(0.6, 0.95, waveHeight);
    foam += smoothstep(0.65, 1.0, abs(dWave1 * 0.5 + 0.5)) * 0.25;
    waterColor = mix(waterColor, foamColor, foam * 0.4);

    // Specular shimmer
    float shimmer = sin(waterUV.x * 100.0 + waterUV.y * 80.0 + uTime * 5.0) * 0.5 + 0.5;
    float spec = shimmer * 0.35;
    waterColor += spec * vec3(1.0, 0.95, 0.8) * 0.4;

    // Caustics
    float caustic1 = sin(waterUV.x * 25.0 + waterUV.y * 15.0 + uTime * 2.0);
    float caustic2 = sin(waterUV.x * 35.0 - waterUV.y * 20.0 + uTime * 1.5);
    float caustic = caustic1 * caustic2 * 0.5 + 0.5;

    // Text texture – minimal distortion for readability
    float textDistort = 0.003;
    vec2 textUV = uv + vec2(
        wave1 * textDistort + wave2 * textDistort * 0.3,
        wave3 * textDistort + wave4 * textDistort * 0.3
    );
    vec4 texColor = texture(uTexture, textUV);

    vec3 finalColor = texColor.rgb;
    finalColor *= (0.88 + waveHeight * 0.12);
    finalColor += caustic * vec3(0.25, 0.55, 0.65) * 0.06;
    finalColor += spec * vec3(1.0, 0.97, 0.9) * 0.08;
    finalColor = mix(finalColor, finalColor * (waterColor + 0.6), 0.18);

    float alpha = texColor.a * uFade;
    fragColor = vec4(finalColor, alpha);
}`;

function createTextCanvas(text, w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#49929a';
    ctx.font = 'bold 48px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    return c;
}

export function initWaterSubtitle() {
    const heroContent = document.querySelector('.hero_content');
    if (!heroContent) return;

    // Remove old h2 if it exists (AETHERTTECT)
    const oldH2 = heroContent.querySelector('h2');
    if (oldH2) {
        oldH2.style.display = 'none';
    }

    // ==============================================
    // 1. "I am" - BEFORE David Zahn
    // ==============================================
    const iAmText = document.createElement('p');
    iAmText.className = 'hero_i_am';
    iAmText.textContent = 'I am';

    // ==============================================
    // 2. "studying Games & Immersive Media ..." - AFTER David Zahn
    // ==============================================
    const studyingText = document.createElement('p');
    studyingText.className = 'hero_studying';
    studyingText.textContent = 'studying Games & Immersive Media at HFU Furtwangen. My interest lies in:';

    // ==============================================
    // 3. CYCLING WATER TEXT
    // ==============================================
    const container = document.createElement('div');
    container.className = 'water-subtitle-container';

    const canvas = document.createElement('canvas');
    canvas.className = 'water-subtitle-canvas';
    const textWidth = 520;
    const textHeight = 65;
    canvas.width = textWidth;
    canvas.height = textHeight;

    container.appendChild(canvas);

    // Insert into DOM in correct order:
    // "I am" → water-text-container (DAVID ZAHN) → "studying..." → cycling subtitle
    const waterContainer = heroContent.querySelector('.water-text-container');
    const insertAfter = waterContainer || heroContent.querySelector('h1');

    if (waterContainer) {
        // Insert "I am" before waterContainer
        heroContent.insertBefore(iAmText, waterContainer);
        // Insert "studying..." after waterContainer
        waterContainer.after(studyingText);
        // Insert cycling subtitle after "studying..."
        studyingText.after(container);
    } else if (insertAfter) {
        // Insert "I am" before h1
        heroContent.insertBefore(iAmText, insertAfter);
        // Insert "studying..." after h1
        insertAfter.after(studyingText);
        // Insert cycling subtitle after "studying..."
        studyingText.after(container);
    } else {
        heroContent.appendChild(iAmText);
        heroContent.appendChild(studyingText);
        heroContent.appendChild(container);
    }

    // ==============================================
    // WebGL setup
    // ==============================================
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn('[water-subtitle] WebGL2 not supported');
        iAmText.remove();
        studyingText.remove();
        container.remove();
        return;
    }

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error('[water-subtitle] Shader error:', gl.getShaderInfoLog(s));
            return null;
        }
        return s;
    }

    const vs = compile(gl.VERTEX_SHADER, vertSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) { iAmText.remove(); studyingText.remove(); container.remove(); return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error('[water-subtitle] Link error:', gl.getProgramInfoLog(prog));
        iAmText.remove(); studyingText.remove(); container.remove();
        return;
    }
    gl.useProgram(prog);

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

    // Text texture – initial
    let currentIndex = 0;
    const textCanvas = createTextCanvas(SUBTITLES[currentIndex], textWidth, textHeight);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uFade = gl.getUniformLocation(prog, 'uFade');
    gl.viewport(0, 0, textWidth, textHeight);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Cycling logic
    const CYCLE_INTERVAL = 3500;
    const FADE_DURATION = 600;
    let fadeState = 'show';
    let fadeProgress = 1;

    function updateTexture(newText) {
        const newCanvas = createTextCanvas(newText, textWidth, textHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, newCanvas);
    }

    let animFrame = null;
    let isActive = true;
    let isVisible = true;
    let startTime = performance.now();
    let lastCycleTime = performance.now();

    function render() {
        if (!isActive) return;
        // Punkt 4: WebGL-Render überspringen, solange das Subtitle off-screen ist
        if (!isVisible) { animFrame = requestAnimationFrame(render); return; }
        const t = (performance.now() - startTime) / 1000.0;
        const now = performance.now();
        const elapsed = now - lastCycleTime;
        
        switch (fadeState) {
            case 'show':
                fadeProgress = 1;
                if (elapsed >= CYCLE_INTERVAL) {
                    fadeState = 'fadeOut';
                    lastCycleTime = now;
                }
                break;
            case 'fadeOut':
                fadeProgress = Math.max(0, 1 - (elapsed / FADE_DURATION));
                if (fadeProgress <= 0) {
                    currentIndex = (currentIndex + 1) % SUBTITLES.length;
                    updateTexture(SUBTITLES[currentIndex]);
                    fadeState = 'fadeIn';
                    lastCycleTime = now;
                }
                break;
            case 'fadeIn':
                fadeProgress = Math.min(1, elapsed / FADE_DURATION);
                if (fadeProgress >= 1) {
                    fadeState = 'show';
                    lastCycleTime = now;
                }
                break;
        }

        gl.uniform1f(uTime, t);
        gl.uniform1f(uFade, fadeProgress);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animFrame = requestAnimationFrame(render);
    }

    animFrame = requestAnimationFrame(render);

    // Punkt 4: pausieren, wenn nicht sichtbar (wie particle-rain.js)
    const heroObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    heroObserver.observe(container);

    cleanupRegistry.register(() => {
        heroObserver.disconnect();
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        container.remove();
        iAmText.remove();
        studyingText.remove();
        if (oldH2) oldH2.style.display = '';
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
    });
}
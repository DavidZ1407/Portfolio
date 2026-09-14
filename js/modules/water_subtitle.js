/* ==========================================================================
   FILE: js/modules/water_subtitle.js
   DESCRIPTION: WebGL water-effect canvas rendering the cycling, localized subtitle text in the hero.
   ========================================================================== */

import { translations } from '../constants/translations.js?v=3';
import { getCurrentLang } from './language.js';
import { cleanupRegistry, waitForFont } from '../utils/helpers.js';
import { isModalResumeStagger } from '../utils/modal_resume.js?v=2';
import { INTERSECTION_THRESHOLD } from '../constants/ui.js';


const SUBTITLE_KEYS = [
    'home-subtitle-cycle-1',
    'home-subtitle-cycle-2',
    'home-subtitle-cycle-3',
    'home-subtitle-cycle-4',
    'home-subtitle-cycle-5',
];


const SUBTITLE_CANVAS_WIDTH = 520;
const SUBTITLE_CANVAS_HEIGHT = 65;




const SUBTITLE_FONT = 'bold 48px Cinzel, serif';

function getSubtitles(lang) {
    const texts = translations[lang] || translations.en;
    return SUBTITLE_KEYS.map(key => texts[key] || translations.en[key]);
}


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

    
    vec3 deepBlue = vec3(0.0, 0.05, 0.2);
    vec3 midWater = vec3(0.0, 0.25, 0.45);
    vec3 shallowWater = vec3(0.05, 0.55, 0.65);
    vec3 foamColor = vec3(0.7, 0.9, 0.95);

    
    float wave1 = sin(uv.x * 40.0 + uTime * 1.8) * cos(uv.y * 35.0 + uTime * 1.2);
    float wave2 = sin(uv.x * 60.0 + uv.y * 50.0 + uTime * 2.5);
    float wave3 = cos(uv.x * 25.0 - uv.y * 30.0 + uTime * 1.0);
    float wave4 = sin((uv.x + uv.y) * 45.0 + uTime * 3.2);

    float distortStrength = 0.008;
    vec2 waterUV = uv + vec2(
        wave1 * distortStrength + wave2 * distortStrength * 0.5,
        wave3 * distortStrength + wave4 * distortStrength * 0.5
    );

    
    float dWave1 = sin(waterUV.x * 40.0 + uTime * 1.8) * cos(waterUV.y * 35.0 + uTime * 1.2);
    float dWave2 = sin(waterUV.x * 55.0 + waterUV.y * 45.0 + uTime * 2.5);
    float dWave3 = cos(waterUV.x * 20.0 - waterUV.y * 25.0 + uTime * 1.0);
    float dWave4 = sin((waterUV.x + waterUV.y) * 40.0 + uTime * 3.2);

    float combinedWaves = dWave1 * 0.35 + dWave2 * 0.3 + dWave3 * 0.2 + dWave4 * 0.15;
    float waveHeight = combinedWaves * 0.5 + 0.5;

    
    vec3 waterColor = mix(deepBlue, midWater, waveHeight * 1.3);
    waterColor = mix(waterColor, shallowWater, max(0.0, waveHeight * 1.5 - 0.5));

    
    float foam = smoothstep(0.6, 0.95, waveHeight);
    foam += smoothstep(0.65, 1.0, abs(dWave1 * 0.5 + 0.5)) * 0.25;
    waterColor = mix(waterColor, foamColor, foam * 0.4);

    
    float shimmer = sin(waterUV.x * 100.0 + waterUV.y * 80.0 + uTime * 5.0) * 0.5 + 0.5;
    float spec = shimmer * 0.35;
    waterColor += spec * vec3(1.0, 0.95, 0.8) * 0.4;

    
    float caustic1 = sin(waterUV.x * 25.0 + waterUV.y * 15.0 + uTime * 2.0);
    float caustic2 = sin(waterUV.x * 35.0 - waterUV.y * 20.0 + uTime * 1.5);
    float caustic = caustic1 * caustic2 * 0.5 + 0.5;

    
    float textDistort = 0.003;
    vec2 textUV = uv + vec2(
        wave1 * textDistort + wave2 * textDistort * 0.3,
        wave3 * textDistort + wave4 * textDistort * 0.3
    );
    vec4 texColor = texture(uTexture, textUV);

    vec3 finalColor = texColor.rgb;
    finalColor *= (0.88 + waveHeight * 0.12);
    finalColor += caustic * vec3(0.55, 0.45, 0.28) * 0.06;
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
    ctx.fillStyle = '#c9a861';
    ctx.font = SUBTITLE_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
    return c;
}

export function initWaterSubtitle() {
    const heroContent = document.querySelector('.hero_content');
    if (!heroContent) return;


    let SUBTITLES = getSubtitles(getCurrentLang());


    const oldH2 = heroContent.querySelector('h2');
    if (oldH2) {
        oldH2.style.display = 'none';
    }




    const iAmText = document.createElement('p');
    iAmText.className = 'hero_i_am';
    iAmText.textContent = translations[getCurrentLang()]['home-i-am'] || 'I am';




    const studyingText = document.createElement('p');
    studyingText.className = 'hero_studying';
    studyingText.textContent = translations[getCurrentLang()]['home-studying'] || 'studying Games & Immersive Media at HFU Furtwangen. My interest lies in:';




    const container = document.createElement('div');
    container.className = 'water-subtitle-container';

    const canvas = document.createElement('canvas');
    canvas.className = 'water-subtitle-canvas';
    const textWidth = SUBTITLE_CANVAS_WIDTH;
    const textHeight = SUBTITLE_CANVAS_HEIGHT;
    canvas.width = textWidth;
    canvas.height = textHeight;

    container.appendChild(canvas);



    const waterContainer = heroContent.querySelector('.water-text-container');
    const insertAfter = waterContainer || heroContent.querySelector('h1');

    if (waterContainer) {

        heroContent.insertBefore(iAmText, waterContainer);

        waterContainer.after(studyingText);

        studyingText.after(container);
    } else if (insertAfter) {

        heroContent.insertBefore(iAmText, insertAfter);

        insertAfter.after(studyingText);

        studyingText.after(container);
    } else {
        heroContent.appendChild(iAmText);
        heroContent.appendChild(studyingText);
        heroContent.appendChild(container);
    }




    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn('[water-subtitle] WebGL2 not supported');
        iAmText.remove();
        studyingText.remove();
        container.remove();
        return;
    }




    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.warn('[water-subtitle] WebGL context lost - falling back to static text.');
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        iAmText.remove();
        studyingText.remove();
        container.remove();
    }, { once: true });

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

    const verts = new Float32Array([-1, -1, 0, 1, 1, -1, 1, 1, -1, 1, 0, 0, 1, 1, 1, 0]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'aPosition');
    const aTex = gl.getAttribLocation(prog, 'aTexcoord');
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);


    let currentIndex = 0;
    const textCanvas = createTextCanvas(SUBTITLES[currentIndex], textWidth, textHeight);
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);





    const fontReadyPromise = waitForFont(SUBTITLE_FONT);
    let textureHasCinzel = false;
    function redrawTextureWithCinzel(text) {
        if (textureHasCinzel) return;
        fontReadyPromise.then(() => {
            if (!isActive || textureHasCinzel) return;
            const freshCanvas = createTextCanvas(text, textWidth, textHeight);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, freshCanvas);

            textureHasCinzel = true;
        }).catch(() => { textureHasCinzel = true; });
    }

    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uFade = gl.getUniformLocation(prog, 'uFade');
    gl.viewport(0, 0, textWidth, textHeight);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);


    const CYCLE_INTERVAL = 3500;
    const FADE_DURATION = 600;
    let fadeState = 'show';
    let fadeProgress = 1;

    function updateTexture(newText) {
        const newCanvas = createTextCanvas(newText, textWidth, textHeight);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, newCanvas);


        redrawTextureWithCinzel(newText);
    }

    let animFrame = null;
    let isActive = true;
    let isVisible = true;
    let startTime = performance.now();
    let lastCycleTime = performance.now();

    function render() {
        if (!isActive) return;

        if (!isVisible) { animFrame = requestAnimationFrame(render); return; }

        if (document.body.classList.contains('modal-open') || isModalResumeStagger(4)) { animFrame = requestAnimationFrame(render); return; }
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

    function updateLanguage() {
        const lang = getCurrentLang();
        SUBTITLES = getSubtitles(lang);
        if (currentIndex >= SUBTITLES.length) currentIndex = 0;
        if (iAmText) iAmText.textContent = translations[lang]['home-i-am'] || 'I am';
        if (studyingText) studyingText.textContent = translations[lang]['home-studying'] || 'studying Games & Immersive Media at HFU Furtwangen. My interest lies in:';
        updateTexture(SUBTITLES[currentIndex]);
        fadeState = 'show';
        fadeProgress = 1;
        lastCycleTime = performance.now();
    }

    document.addEventListener('languageChanged', updateLanguage);



    redrawTextureWithCinzel(SUBTITLES[currentIndex]);


    const heroObserver = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
    }, { threshold: INTERSECTION_THRESHOLD });
    heroObserver.observe(container);

    cleanupRegistry.register(() => {
        heroObserver.disconnect();
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        container.remove();
        iAmText.remove();
        studyingText.remove();
        if (oldH2) oldH2.style.display = '';
        document.removeEventListener('languageChanged', updateLanguage);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.deleteTexture(tex);
        gl.deleteBuffer(buf);
    });
}
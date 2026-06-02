/* ========================================= */
/* MODULE - NAVBAR WATER WAVE */
/* Like flood.js wave but under nav links */
/* ========================================= */

import { debounce, cleanupRegistry } from '../utils/helpers.js';
import { smoothLerp } from '../utils/smooth.js';

export function initNavWater() {
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!header || navLinks.length === 0) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'nav-water-canvas';
    canvas.style.cssText = `
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 100%;
        height: 20px;
        pointer-events: none;
        z-index: 10;
        opacity: 0;
        transition: opacity 0.5s ease;
    `;
    header.style.position = 'relative';
    header.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let time = 0;
    let activeLinkIndex = 0;
    let smoothCenterX = 0; // Smoothed wave center X position
    let animFrame = null;
    let width, height = 20;
    let isActive = true;

    function resize() {
        width = canvas.width = canvas.offsetWidth || header.offsetWidth;
        canvas.height = height;
    }

    resize();

    const debouncedResize = debounce(resize, 100);
    window.addEventListener('resize', debouncedResize);

    // Track which link is active
    function updateActiveLink() {
        const scrollY = window.scrollY;
        const sections = document.querySelectorAll('section[id]');

        sections.forEach((section) => {
            const sectionTop = section.offsetTop - 200;
            const sectionHeight = section.clientHeight;

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                const id = section.getAttribute('id');
                navLinks.forEach((link, i) => {
                    if (link.getAttribute('href') === `#${id}`) {
                        activeLinkIndex = i;
                    }
                });
            }
        });
    }

    function getLinkPosition(index) {
        if (index >= 0 && index < navLinks.length) {
            const rect = navLinks[index].getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            return {
                x: rect.left - headerRect.left + rect.width / 2,
                width: rect.width,
            };
        }
        return { x: width / 2, width: 100 };
    }

    function drawWave() {
        const w = width;
        const h = height;

        // Show canvas only if there's an active section (not at very top)
        const scrollY = window.scrollY;
        canvas.style.opacity = scrollY > 50 ? '1' : '0';
        if (scrollY <= 50) {
            ctx.clearRect(0, 0, w, h);
            return;
        }

        ctx.clearRect(0, 0, w, h);

        const link = getLinkPosition(activeLinkIndex);
        // Smooth wave center transition (lusion-style: no jump, just glide)
        smoothCenterX = smoothLerp(smoothCenterX, link.x, 0.08);
        const waveCenter = smoothCenterX;
        const waveWidth = link.width + 40;

        // Draw main wave line
        ctx.beginPath();
        ctx.moveTo(0, h / 2);

        for (let x = 0; x <= w; x += 2) {
            // Wave amplitude decays away from center link
            const dist = Math.abs(x - waveCenter);
            const decay = Math.max(0, 1 - dist / (waveWidth + 100));
            
            // Multiple sine waves for organic look
            const wave = Math.sin(x * 0.03 + time * 2) * 3 * decay
                + Math.sin(x * 0.05 + time * 1.5) * 2 * decay
                + Math.sin(x * 0.01 + time * 0.8) * 4 * decay;
            
            const y = (h / 2) + wave;
            ctx.lineTo(x, y);
        }

        // Glow (outer)
        ctx.strokeStyle = 'rgba(73, 146, 154, 0.15)';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Main wave
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        for (let x = 0; x <= w; x += 2) {
            const dist = Math.abs(x - waveCenter);
            const decay = Math.max(0, 1 - dist / (waveWidth + 100));
            const wave = Math.sin(x * 0.03 + time * 2) * 3 * decay
                + Math.sin(x * 0.05 + time * 1.5) * 2 * decay
                + Math.sin(x * 0.01 + time * 0.8) * 4 * decay;
            const y = (h / 2) + wave;
            ctx.lineTo(x, y);
        }
        
        // Gold glow = near center, cyan = edges
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        grad.addColorStop(0, 'rgba(73, 146, 154, 0)');
        grad.addColorStop(Math.max(0, (waveCenter - waveWidth/2) / w), 'rgba(73, 146, 154, 0.2)');
        grad.addColorStop(Math.max(0, (waveCenter - 40) / w), 'rgba(201, 168, 97, 0.6)');
        grad.addColorStop(waveCenter / w, 'rgba(201, 168, 97, 0.9)');
        grad.addColorStop(Math.min(1, (waveCenter + 40) / w), 'rgba(201, 168, 97, 0.6)');
        grad.addColorStop(Math.min(1, (waveCenter + waveWidth/2) / w), 'rgba(73, 146, 154, 0.2)');
        grad.addColorStop(1, 'rgba(73, 146, 154, 0)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Fill area below wave (translucent water)
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        
        const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
        fillGrad.addColorStop(0, 'rgba(73, 146, 154, 0.03)');
        fillGrad.addColorStop(0.3, 'rgba(201, 168, 97, 0.05)');
        fillGrad.addColorStop(1, 'rgba(73, 146, 154, 0.08)');
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Emit a few bubbles near the active link
        for (let i = 0; i < 3; i++) {
            const bubbleX = waveCenter + Math.sin(time + i * 2) * 20;
            const bubbleY = h - 5 - (time * 20 + i * 15) % 25;
            const bubbleR = 1 + Math.sin(time * 0.5 + i) * 0.5;
            const bubbleAlpha = 0.2 - (bubbleY / h) * 0.15;

            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleR, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(201, 168, 97, ${bubbleAlpha})`;
            ctx.fill();
        }
    }

    function animate() {
        if (!isActive) return;
        time += 0.016;
        drawWave();
        animFrame = requestAnimationFrame(animate);
    }

    const onScroll = () => updateActiveLink();
    window.addEventListener('scroll', onScroll, { passive: true });
    updateActiveLink();
    animate();

    // Register cleanup
    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', debouncedResize);
        canvas.remove();
    });
}
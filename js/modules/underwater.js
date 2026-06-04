/* ========================================= */
/* MODULE - UNDERWATER ATMOSPHERE */
/* Anglerfish lure that travels along timeline */
/* ========================================= */

import { debounce, cleanupRegistry } from '../utils/helpers.js';
import { smoothLerp, Easing } from '../utils/smooth.js';

export function initUnderwater() {
    const section = document.querySelector('.journey_section');
    const container = document.querySelector('.water_timeline');
    if (!section || !container) return;

    // Remove old canvas if exists
    const oldCanvas = container.querySelector('.underwater-canvas');
    if (oldCanvas) oldCanvas.remove();

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.className = 'underwater-canvas';
    canvas.style.cssText = `
        position: absolute;
        left: 50%;
        top: 0;
        transform: translateX(-50%);
        width: 200px;
        height: 100%;
        z-index: 1;
        pointer-events: none;
        opacity: 0;
        transition: opacity 1.5s ease;
    `;
    container.prepend(canvas);
    container.style.position = 'relative';

    const ctx = canvas.getContext('2d');
    let animFrame = null;
    let isActive = false;
    let time = 0;

    // Lure state
    let lureY = 0;
    let lureTargetY = 0;
    let lureGlow = 0;
    let lureTrail = [];
    let particles = [];
    let bubbles = [];
    let currentNodeIndex = -1;

    // Intersection Observer for scroll reveal
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                canvas.style.opacity = '1';
                if (!isActive) {
                    isActive = true;
                    resize();
                    initParticles();
                    animate();
                }
            } else {
                canvas.style.opacity = '0';
                if (isActive) {
                    isActive = false;
                    if (animFrame) {
                        cancelAnimationFrame(animFrame);
                        animFrame = null;
                    }
                }
            }
        });
    }, { threshold: 0.05 });

    observer.observe(section);

    function resize() {
        const rect = container.getBoundingClientRect();
        canvas.width = 200;
        canvas.height = rect.height;
    }

    const debouncedResize = debounce(resize, 150);
    window.addEventListener('resize', debouncedResize);
    // Initial resize with delay to ensure layout is ready
    setTimeout(resize, 50);

    function initParticles() {
        particles = [];
        bubbles = [];

        const w = canvas.width || 200;

        // Floating bioluminescent particles
        for (let i = 0; i < 20; i++) {
            const isGold = Math.random() > 0.5;
            particles.push({
                x: 30 + Math.random() * (w - 60),
                y: Math.random() * canvas.height,
                r: 0.5 + Math.random() * 1.5,
                color: isGold ? '201, 168, 97' : '73, 146, 154',
                floatAmp: 3 + Math.random() * 8,
                floatSpeed: 0.3 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
                maxOpacity: 0.2 + Math.random() * 0.4,
                opacity: 0,
                delay: Math.random() * 3,
            });
        }

        // Small bubbles rising
        for (let i = 0; i < 8; i++) {
            bubbles.push({
                x: 60 + Math.random() * 80,
                y: Math.random() * canvas.height,
                r: 1 + Math.random() * 2,
                speed: 0.2 + Math.random() * 0.5,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.03,
                opacity: 0.1 + Math.random() * 0.2,
            });
        }
    }

    function getNodePositions() {
        const nodes = container.querySelectorAll('.timeline_item');
        const containerRect = container.getBoundingClientRect();
        const positions = [];

        nodes.forEach(node => {
            const rect = node.getBoundingClientRect();
            const y = rect.top - containerRect.top + rect.height / 2;
            positions.push({ y, visible: node.classList.contains('show') });
        });

        return positions;
    }

    function animate() {
        if (!isActive) return;

        const w = canvas.width;
        const h = canvas.height;
        time += 0.016;

        ctx.clearRect(0, 0, w, h);

        const nodes = getNodePositions();
        if (nodes.length === 0) {
            animFrame = requestAnimationFrame(animate);
            return;
        }

        const centerX = 100; // Center of the 200px canvas

        // Draw the fishing line (subtle, organic)
        drawFishingLine(centerX, nodes);

        // Calculate lure target - travel between nodes
        updateLurePosition(nodes);

        // Draw the anglerfish lure
        drawLure(centerX);

        // Draw trail
        drawTrail(centerX);

        // Draw floating particles
        drawParticles();

        // Draw bubbles
        drawBubbles();

        animFrame = requestAnimationFrame(animate);
    }

    function drawFishingLine(centerX, nodes) {
        if (nodes.length < 2) return;

        const startY = nodes[0].y;
        const endY = nodes[nodes.length - 1].y;

        // Organic fishing line with subtle sway
        ctx.beginPath();
        ctx.moveTo(centerX, startY - 40);

        const segments = 60;
        const segHeight = (endY - startY + 80) / segments;

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = (startY - 40) + t * (endY - startY + 80);

            // Organic sway
            const sway = Math.sin(t * Math.PI * 3 + time * 0.5) * 3
                + Math.sin(t * Math.PI * 5 + time * 0.3) * 1.5;

            const x = centerX + sway;

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        // Line glow (outer)
        ctx.strokeStyle = 'rgba(73, 146, 154, 0.1)';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Line main
        ctx.strokeStyle = 'rgba(73, 146, 154, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function updateLurePosition(nodes) {
        // Move lure smoothly between visible nodes
        const visibleNodes = nodes.filter(n => n.visible);
        if (visibleNodes.length === 0) {
            lureTargetY = nodes[0].y;
        } else {
            // Lure travels to the latest visible node
            lureTargetY = visibleNodes[visibleNodes.length - 1].y;

            // Determine current node for glow effect
            const newClosest = findClosestNodeIndex(lureTargetY, nodes);
            if (newClosest !== currentNodeIndex) {
                currentNodeIndex = newClosest;
                // Pulse glow when reaching new node
                lureGlow = 1.5;
            }
        }

        // Smooth interpolation (lusion-style eased lerp)
        lureY = smoothLerp(lureY, lureTargetY, 0.04);

        // Decay glow
        if (lureGlow > 0) {
            lureGlow -= 0.008;
        }

        // Add to trail
        lureTrail.push({
            y: lureY,
            opacity: 0.4,
            age: 0,
        });

        // Limit trail length
        if (lureTrail.length > 30) {
            lureTrail.shift();
        }
    }

    function findClosestNodeIndex(y, nodes) {
        let closest = 0;
        let minDist = Infinity;
        nodes.forEach((node, i) => {
            const dist = Math.abs(node.y - y);
            if (dist < minDist) {
                minDist = dist;
                closest = i;
            }
        });
        return closest;
    }

    function drawLure(centerX) {
        const sway = Math.sin(time * 0.8) * 4;
        const bobY = Math.sin(time * 1.2) * 3;
        const x = centerX + sway;
        const y = lureY + bobY;

        // Fishing line from top to lure
        ctx.beginPath();
        ctx.moveTo(centerX, -20);
        ctx.lineTo(x, y);
        ctx.strokeStyle = 'rgba(73, 146, 154, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Lure "hook" shape (subtle)
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 3, y + 8);
        ctx.quadraticCurveTo(x + 8, y + 14, x + 2, y + 16);
        ctx.strokeStyle = 'rgba(201, 168, 97, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Main glow orb (the anglerfish lure)
        const glowIntensity = 0.6 + Math.sin(time * 2) * 0.2 + lureGlow * 0.4;

        // Outer glow halo (large, soft)
        const gradient3 = ctx.createRadialGradient(x, y, 0, x, y, 50 + lureGlow * 30);
        gradient3.addColorStop(0, `rgba(201, 168, 97, ${0.15 * glowIntensity})`);
        gradient3.addColorStop(0.3, `rgba(73, 146, 154, ${0.08 * glowIntensity})`);
        gradient3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, 50 + lureGlow * 30, 0, Math.PI * 2);
        ctx.fillStyle = gradient3;
        ctx.fill();

        // Medium glow
        const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, 20 + lureGlow * 15);
        gradient2.addColorStop(0, `rgba(201, 168, 97, ${0.4 * glowIntensity})`);
        gradient2.addColorStop(0.5, `rgba(73, 146, 154, ${0.15 * glowIntensity})`);
        gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.beginPath();
        ctx.arc(x, y, 20 + lureGlow * 15, 0, Math.PI * 2);
        ctx.fillStyle = gradient2;
        ctx.fill();

        // Inner bright core
        const gradient1 = ctx.createRadialGradient(x, y, 0, x, y, 6);
        gradient1.addColorStop(0, `rgba(255, 255, 220, ${0.9 * glowIntensity})`);
        gradient1.addColorStop(0.4, `rgba(201, 168, 97, ${0.7 * glowIntensity})`);
        gradient1.addColorStop(1, 'rgba(201, 168, 97, 0)');
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = gradient1;
        ctx.fill();

        // Pulsing ring
        const ringRadius = 8 + Math.sin(time * 3) * 3 + lureGlow * 10;
        const ringOpacity = 0.2 + Math.sin(time * 2.5) * 0.1 + lureGlow * 0.3;
        ctx.beginPath();
        ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 168, 97, ${ringOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Emit particles when glow is high
        if (lureGlow > 0.3) {
            for (let i = 0; i < 2; i++) {
                particles.push({
                    x: x + (Math.random() - 0.5) * 20,
                    y: y + (Math.random() - 0.5) * 20,
                    r: 0.5 + Math.random() * 1.5,
                    color: Math.random() > 0.5 ? '201, 168, 97' : '150, 220, 220',
                    floatAmp: 2 + Math.random() * 5,
                    floatSpeed: 0.5 + Math.random() * 1,
                    phase: Math.random() * Math.PI * 2,
                    maxOpacity: 0.5 + Math.random() * 0.5,
                    opacity: 0.5,
                    delay: 0,
                    life: 60 + Math.random() * 60,
                    age: 0,
                });
            }
        }
    }

    function drawTrail(centerX) {
        lureTrail.forEach((point, i) => {
            point.opacity -= 0.012;
            point.age++;

            if (point.opacity <= 0) return;

            const sway = Math.sin((point.age * 0.02) + point.y * 0.01) * 3;
            const x = centerX + sway;

            ctx.beginPath();
            ctx.arc(x, point.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(201, 168, 97, ${point.opacity * 0.3})`;
            ctx.fill();
        });

        // Clean up dead trail points
        while (lureTrail.length > 0 && lureTrail[0].opacity <= 0) {
            lureTrail.shift();
        }
    }

    function drawParticles() {
        particles.forEach(p => {
            if (time < p.delay) return;

            // Handle lifetime particles (from lure)
            if (p.life !== undefined) {
                p.age++;
                if (p.age > p.life) {
                    p.opacity = 0;
                    return;
                }
                const lifeRatio = p.age / p.life;
                p.opacity = p.maxOpacity * (1 - lifeRatio);
            } else {
                p.opacity = Math.min(p.maxOpacity, p.opacity + 0.005);
            }

            const floatY = p.y + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            const alpha = p.opacity * (0.5 + 0.5 * Math.sin(time * 0.5 + p.phase));

            // Glow halo
            ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.1})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 6, 0, 6.2832);
            ctx.fill();

            // Main particle
            ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, 6.2832);
            ctx.fill();
        });

        // Remove dead lifetime particles
        particles = particles.filter(p => p.life === undefined || p.opacity > 0.01);
    }

    function drawBubbles() {
        bubbles.forEach(b => {
            b.wobble += b.wobbleSpeed;
            b.y -= b.speed;
            if (b.y < -10) {
                b.y = canvas.height + 10;
                b.x = 60 + Math.random() * 80;
            }
            b.x += Math.sin(b.wobble) * 0.5;

            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(73, 146, 154, ${b.opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        });
    }

    // Register cleanup with centralized registry (replaces beforeunload)
    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
        canvas.remove();
    });
}
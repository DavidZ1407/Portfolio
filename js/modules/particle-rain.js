/* ========================================= */
/* MODULE - CONTACT SECTION LIGHT RAYS */
/* Dynamische Lichtstrahlen wie Unterwasser */
/* + Biolumineszente Partikel mit Lifecycle */
/* 60fps garantiert via Low-Res Buffering     */
/* für große Viewports (2056px-4000px)        */
/* ========================================= */

export function initContactRain() {
    const section = document.querySelector('.contact_section');
    if (!section) return;

    const oldCanvas = section.querySelector('.rain-canvas');
    if (oldCanvas) oldCanvas.remove();

    const canvas = document.createElement('canvas');
    canvas.className = 'rain-canvas';
    canvas.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 1;
        pointer-events: none;
    `;
    section.style.position = 'relative';
    section.prepend(canvas);

    const ctx = canvas.getContext('2d');
    let animFrame = null;
    let isVisible = false;
    let isAnimating = false;
    let time = 0;

    // ---- VIEWPORT DETECTION ----
    const vw = window.innerWidth;
    const isLarge = vw >= 2056;
    const isXLarge = vw >= 3000;

    /* 
     * PERFORMANCE STRATEGY for 2056px-4000px:
     * Instead of skipping frames (which causes 20fps stutter),
     * we use a low-resolution internal buffer. On large viewports
     * we render at 50% scale internally, then draw scaled-up.
     * This cuts pixel fill rate by 4x = smooth 60fps.
     */
    const SCALE = isXLarge ? 0.35 : isLarge ? 0.5 : 1.0;
    const useBuffer = SCALE < 1.0;

    // Adaptive quality
    const SEGMENTS = isXLarge ? 6 : isLarge ? 8 : 20;
    const MAX_PARTICLES = isXLarge ? 12 : isLarge ? 18 : 35;
    const PARTICLE_SPAWN_INTERVAL = isLarge ? 0.1 : 0.05;
    // Reduce ray count on large screens
    const RAY_COUNT = isXLarge ? 3 : isLarge ? 4 : 6;

    let particles = [];
    let spawnTimer = 0;

    // Buffered rendering
    let buffer = null;
    let bCtx = null;

    function ensureBuffer(w, h) {
        if (!useBuffer) {
            ctx.imageSmoothingEnabled = false;
            return;
        }
        if (!buffer || buffer.width !== Math.ceil(w * SCALE) || buffer.height !== Math.ceil(h * SCALE)) {
            buffer = document.createElement('canvas');
            buffer.width = Math.ceil(w * SCALE);
            buffer.height = Math.ceil(h * SCALE);
            bCtx = buffer.getContext('2d');
        }
        ctx.imageSmoothingEnabled = true;
    }

    function spawnParticle() {
        if (particles.length >= MAX_PARTICLES) return;
        const w = canvas.width;
        const h = canvas.height;
        if (!w || !h) return;

        const rayX = [0.15, 0.30, 0.45, 0.55, 0.70, 0.85];
        const baseX = rayX[Math.floor(Math.random() * rayX.length)];
        const x = w * (baseX + (Math.random() - 0.5) * 0.08);
        const y = h * (0.05 + Math.random() * 0.35);
        const isGold = Math.random() > 0.75;

        particles.push({
            x, y,
            size: 1.0 + Math.random() * 2.5,
            speedY: 0.15 + Math.random() * 0.4,
            speedX: (Math.random() - 0.5) * 0.15,
            floatAmp: 2 + Math.random() * 5,
            floatSpeed: 0.3 + Math.random() * 0.6,
            phase: Math.random() * Math.PI * 2,
            life: 180 + Math.random() * 240,
            age: 0,
            isGold,
            opacity: 0,
            maxOpacity: isGold ? 0.25 : 0.18,
        });
    }

    function updateAndDrawParticles(drawCtx, w, h) {
        const s = useBuffer ? SCALE : 1;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.age++;

            // DIE
            if (p.age > p.life) {
                p.opacity -= 0.03;
                if (p.opacity <= 0) { particles.splice(i, 1); continue; }
            } else {
                p.opacity = p.age < 30 ? p.maxOpacity * (p.age / 30) : p.maxOpacity;
            }

            // LIFE: movement
            p.y += p.speedY;
            p.x += p.speedX;
            const swayX = Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;

            // Wrap
            if (p.y > h + 10) { p.y = -10; p.x = w * (0.1 + Math.random() * 0.8); p.age = 0; p.life = 180 + Math.random() * 240; p.opacity = 0; }
            if (p.x < -20) p.x = w + 10;
            if (p.x > w + 20) p.x = -10;

            const drawX = (p.x + swayX) * s;
            const drawY = p.y * s;
            const alpha = p.opacity;
            if (alpha <= 0.01) continue;

            const [r, g, b] = p.isGold ? [201, 168, 97] : [73, 146, 154];
            const radius = p.size * s;

            // Simple draw - no radial gradient, just 3 circles for glow
            // Layer 1: outer glow (single circle with transparency)
            drawCtx.globalAlpha = alpha * 0.25;
            drawCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            drawCtx.beginPath();
            drawCtx.arc(drawX, drawY, radius * 5, 0, Math.PI * 2);
            drawCtx.fill();

            // Layer 2: mid glow
            drawCtx.globalAlpha = alpha * 0.5;
            drawCtx.beginPath();
            drawCtx.arc(drawX, drawY, radius * 2.5, 0, Math.PI * 2);
            drawCtx.fill();

            // Layer 3: bright core
            drawCtx.globalAlpha = alpha;
            drawCtx.beginPath();
            drawCtx.arc(drawX, drawY, radius * 0.6, 0, Math.PI * 2);
            drawCtx.fill();

            // White highlight
            if (radius > 0.8) {
                drawCtx.globalAlpha = alpha * 0.35;
                drawCtx.fillStyle = '#ffffff';
                drawCtx.beginPath();
                drawCtx.arc(drawX - 0.3 * s, drawY - 0.3 * s, radius * 0.2, 0, Math.PI * 2);
                drawCtx.fill();
            }
        }
        drawCtx.globalAlpha = 1;
    }

    // ---- LIGHT RAYS ----
    function drawRays(drawCtx, w, h) {
        const s = useBuffer ? SCALE : 1;
        const sw = w * s;
        const sh = h * s;

        // Only render configured number of rays, pick the most visible ones
        const allRays = [
            { x: 0.15, width: 8, length: 0.60, speed: 0.25, color: [73, 146, 154], delay: 0, opacity: 0.25 },
            { x: 0.45, width: 6, length: 0.55, speed: 0.2, color: [201, 168, 97], delay: 1.5, opacity: isLarge ? 0.12 : 0.08 },
            { x: 0.70, width: 6, length: 0.55, speed: 0.3, color: [73, 146, 154], delay: 1.2, opacity: 0.18 },
            { x: 0.30, width: 2, length: 0.40, speed: 0.4, color: [73, 146, 154], delay: 0.8, opacity: 0.08 },
            { x: 0.55, width: 2, length: 0.40, speed: 0.35, color: [73, 146, 154], delay: 0.4, opacity: 0.06 },
            { x: 0.85, width: 2, length: 0.35, speed: 0.4, color: [73, 146, 154], delay: 0.2, opacity: 0.07 },
        ];

        const rays = allRays.slice(0, RAY_COUNT);

        rays.forEach(ray => {
            const baseX = sw * ray.x;
            const length = sh * ray.length;
            
            const swayX = Math.sin(time * ray.speed * 0.3 + ray.delay) * 80 * s
                        + Math.sin(time * ray.speed * 0.1 + ray.delay * 1.5) * 40 * s;
            const x = baseX + swayX;

            const lengthPulse = 0.85 + 0.15 * Math.sin(time * ray.speed * 0.3 + ray.delay);
            const currentLength = length * lengthPulse;

            const fadePulse = 0.3 + 0.7 * Math.sin(time * ray.speed * 0.15 + ray.delay * 2);
            const fade = Math.max(0, Math.min(1, fadePulse));
            const alpha = ray.opacity * fade;

            const [r, g, b] = ray.color;

            const startY = -5 * s + Math.sin(time * ray.speed * 0.2 + ray.delay) * 15 * s;
            const endY = startY + currentLength;

            // Simplified ray: just draw as a filled polygon with fewer segments
            const segH = currentLength / SEGMENTS;
            const rayWidth = ray.width * s;
            
            drawCtx.save();

            // Build ray path
            drawCtx.beginPath();
            for (let i = 0; i <= SEGMENTS; i++) {
                const t = i / SEGMENTS;
                const y = startY + i * segH;
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3 * s;
                const widthAt = rayWidth * (1 - t * 0.7);
                
                if (i === 0) {
                    drawCtx.moveTo(x + waveX - widthAt / 2, y);
                    drawCtx.lineTo(x + waveX + widthAt / 2, y);
                } else {
                    drawCtx.lineTo(x + waveX + widthAt / 2, y);
                }
            }
            for (let i = SEGMENTS; i >= 0; i--) {
                const t = i / SEGMENTS;
                const y = startY + i * segH;
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3 * s;
                const widthAt = rayWidth * (1 - t * 0.7);
                drawCtx.lineTo(x + waveX - widthAt / 2, y);
            }
            drawCtx.closePath();

            // Gradient fill
            const grad = drawCtx.createLinearGradient(x, startY * s, x, endY);
            const a = Math.min(1, alpha);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            grad.addColorStop(0.05, `rgba(${r}, ${g}, ${b}, ${a * 0.5})`);
            grad.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, ${a * 1.0})`);
            grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${a})`);
            grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${a * 0.6})`);
            grad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${a * 0.2})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            drawCtx.fillStyle = grad;
            drawCtx.fill();

            // Core highlight (simplified - no second path, just brighter fill)
            drawCtx.globalAlpha = 0.2;
            drawCtx.fillStyle = `rgba(255, 255, 255, ${a * 0.4})`;
            drawCtx.fill();
            drawCtx.globalAlpha = 1;

            drawCtx.restore();
        });
    }

    function resize() {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
        ensureBuffer(canvas.width, canvas.height);
    }

    window.addEventListener('resize', resize);

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !isAnimating) startAnimation();
    }, { threshold: 0.1 });
    observer.observe(section);

    function startAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        particles = [];
        spawnTimer = 0;
        time = 0;
        lastFrameTime = 0;
        // Ensure buffer exists
        ensureBuffer(canvas.width || section.offsetWidth, canvas.height || section.offsetHeight);
        animate(performance.now());
    }

    let lastFrameTime = 0;

    function animate(now) {
        if (!isVisible) { isAnimating = false; return; }
        if (!lastFrameTime) lastFrameTime = now;
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        time += dt * 0.5;

        // Always call rAF immediately for smooth 60fps timing
        animFrame = requestAnimationFrame(animate);

        const w = canvas.width || section.offsetWidth;
        const h = canvas.height || section.offsetHeight;

        if (!w || !h || !isFinite(w) || !isFinite(h)) return;

        // Choose drawing context: buffer or direct
        const drawCtx = useBuffer ? bCtx : ctx;
        const dw = useBuffer ? buffer.width : w;
        const dh = useBuffer ? buffer.height : h;

        // Clear
        drawCtx.clearRect(0, 0, dw, dh);

        // 1. Draw rays
        drawRays(drawCtx, w, h);

        // 2. Spawn particles
        spawnTimer += dt;
        if (spawnTimer >= PARTICLE_SPAWN_INTERVAL) {
            spawnTimer = 0;
            spawnParticle();
        }

        // 3. Draw particles (with lifecycle)
        updateAndDrawParticles(drawCtx, w, h);

        // 4. If using buffer, blit to main canvas scaled up
        if (useBuffer && buffer) {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(buffer, 0, 0, w, h);
        }
    }

    // Initial setup
    setTimeout(() => {
        resize();
        if (isVisible && !isAnimating) startAnimation();
    }, 100);

    return () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        canvas.remove();
    };
}
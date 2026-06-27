/* ========================================= */
/* MODULE - CONTACT SECTION LIGHT RAYS */
/* Dynamische Lichtstrahlen wie Unterwasser */
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

    function resize() {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
    }

    resize();
    window.addEventListener('resize', resize);

    const observer = new IntersectionObserver((entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible && !isAnimating) {
            startAnimation();
        }
    }, { threshold: 0.1 });
    observer.observe(section);

    function startAnimation() {
        if (isAnimating) return;
        isAnimating = true;
        animate();
    }

    let lastFrameTime = 0;

    function animate(now) {
        if (!isVisible) {
            isAnimating = false;
            return;
        }
        if (!lastFrameTime) lastFrameTime = now;
        const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
        lastFrameTime = now;
        time += dt * 0.5; // scale to maintain original speed (~0.008 per 16ms)
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Dynamische Lichtstrahlen - gemischt: einige breit/stark, einige dünn/schwach
        const rays = [
            { x: 0.15, width: 8, length: 0.60, speed: 0.25, color: [73, 146, 154], delay: 0, opacity: 0.25 },
            { x: 0.30, width: 2, length: 0.40, speed: 0.4, color: [73, 146, 154], delay: 0.8, opacity: 0.08 },
            { x: 0.45, width: 6, length: 0.55, speed: 0.2, color: [201, 168, 97], delay: 1.5, opacity: 0.08 },
            { x: 0.55, width: 2, length: 0.40, speed: 0.35, color: [73, 146, 154], delay: 0.4, opacity: 0.06 },
            { x: 0.70, width: 6, length: 0.55, speed: 0.3, color: [73, 146, 154], delay: 1.2, opacity: 0.18 },
            { x: 0.85, width: 2, length: 0.35, speed: 0.4, color: [73, 146, 154], delay: 0.2, opacity: 0.07 },
        ];

        rays.forEach(ray => {
            const baseX = w * ray.x;
            const length = h * ray.length;
            
            // --- STARKES LINKS-RECHTS SCHWANKEN ---
            const swayX = Math.sin(time * ray.speed * 0.3 + ray.delay) * 80 
                        + Math.sin(time * ray.speed * 0.1 + ray.delay * 1.5) * 40;
            const x = baseX + swayX;

            // Vertikales Pulsieren der Länge
            const lengthPulse = 0.85 + 0.15 * Math.sin(time * ray.speed * 0.3 + ray.delay);
            const currentLength = length * lengthPulse;

            // Periodisches Ein- und Ausblenden - Strahlen tauchen auf und verschwinden wieder
            const fadePulse = 0.3 + 0.7 * Math.sin(time * ray.speed * 0.15 + ray.delay * 2);
            const fade = Math.max(0, Math.min(1, fadePulse));
            const alpha = ray.opacity * fade;

            const [r, g, b] = ray.color;

            // Strahl von ganz oben (leicht versetzt)
            const startY = -5 + Math.sin(time * ray.speed * 0.2 + ray.delay) * 15;
            const endY = startY + currentLength;

            // Wellenförmige horizontale Verzerrung (sinus wellen)
            ctx.save();

            // Weicher Glow
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
            ctx.shadowBlur = 15;

            // Strahl als Pfad mit welligen Seiten
            const segments = 20;
            const segH = currentLength / segments;
            
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const y = startY + i * segH;
                // Sinus-Welle auf dem Strahl
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3;
                const widthAt = ray.width * (1 - t * 0.7); // Verjüngung
                
                if (i === 0) {
                    ctx.moveTo(x + waveX - widthAt / 2, y);
                    ctx.lineTo(x + waveX + widthAt / 2, y);
                } else {
                    ctx.lineTo(x + waveX + widthAt / 2, y);
                }
            }
            for (let i = segments; i >= 0; i--) {
                const t = i / segments;
                const y = startY + i * segH;
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3;
                const widthAt = ray.width * (1 - t * 0.7);
                ctx.lineTo(x + waveX - widthAt / 2, y);
            }
            ctx.closePath();

            // Gradient für den Strahl
            const grad = ctx.createLinearGradient(x, startY, x, endY);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            grad.addColorStop(0.05, `rgba(${r}, ${g}, ${b}, ${alpha * 0.5})`);
            grad.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, ${alpha * 1.2})`);
            grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha})`);
            grad.addColorStop(0.65, `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`);
            grad.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${alpha * 0.2})`);
            grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

            ctx.fillStyle = grad;
            ctx.fill();

            // Hellerer Kern
            ctx.shadowBlur = 20;
            ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
            ctx.globalAlpha = 0.3;
            
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const y = startY + i * segH;
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3;
                const widthAt = (ray.width * 0.3) * (1 - t * 0.6);
                if (i === 0) {
                    ctx.moveTo(x + waveX - widthAt / 2, y);
                    ctx.lineTo(x + waveX + widthAt / 2, y);
                } else {
                    ctx.lineTo(x + waveX + widthAt / 2, y);
                }
            }
            for (let i = segments; i >= 0; i--) {
                const t = i / segments;
                const y = startY + i * segH;
                const waveX = Math.sin(time * ray.speed + t * 3 + ray.delay) * 3;
                const widthAt = (ray.width * 0.3) * (1 - t * 0.6);
                ctx.lineTo(x + waveX - widthAt / 2, y);
            }
            ctx.closePath();
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.fill();

            ctx.restore();
        });

        // --- SANFTE KAUSTIKEN (Lichtbrechung auf dem Boden) ---
        ctx.save();
        ctx.globalAlpha = 0.03;
        for (let i = 0; i < 3; i++) {
            const cx = w * (0.2 + i * 0.3) + Math.sin(time * 0.1 + i * 1.5) * 50;
            const cy = h * 0.85 + Math.sin(time * 0.08 + i * 2) * 10;
            const r = 60 + Math.sin(time * 0.05 + i) * 20;
            
            const caustic = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            caustic.addColorStop(0, 'rgba(73, 146, 154, 0.15)');
            caustic.addColorStop(0.5, 'rgba(73, 146, 154, 0.05)');
            caustic.addColorStop(1, 'rgba(73, 146, 154, 0)');
            ctx.fillStyle = caustic;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        animFrame = requestAnimationFrame(animate);
    }

    return () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        canvas.remove();
    };
}
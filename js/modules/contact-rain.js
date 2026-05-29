/* ========================================= */
/* MODULE - CONTACT SECTION WATER DRIPS */
/* Water droplets falling when section is visible */
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
    let drops = [];
    let splashes = [];
    let ripples = [];

    function resize() {
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
        initDrops();
    }

    function initDrops() {
        drops = [];
        const count = 30; // Reduced from 40
        for (let i = 0; i < count; i++) {
            drops.push({
                x: Math.random() * canvas.width,
                y: -Math.random() * canvas.height * 0.5,
                len: 10 + Math.random() * 25,
                speed: 2 + Math.random() * 4,
                thickness: 1 + Math.random() * 2,
                opacity: 0.15 + Math.random() * 0.4,
            });
        }
    }

    resize();
    window.addEventListener('resize', resize);

    // IntersectionObserver: only animate when visible
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

    function animate() {
        if (!isVisible) {
            isAnimating = false;
            return; // Stop the loop entirely
        }

        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Draw drops
        drops.forEach(d => {
            d.y += d.speed;

            // Drop line
            const grad = ctx.createLinearGradient(d.x, d.y - d.len, d.x, d.y);
            grad.addColorStop(0, 'rgba(73, 146, 154, 0)');
            grad.addColorStop(1, `rgba(73, 146, 154, ${d.opacity})`);

            ctx.beginPath();
            ctx.moveTo(d.x, d.y - d.len);
            ctx.lineTo(d.x, d.y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = d.thickness;
            ctx.lineCap = 'round';
            ctx.stroke();

            // Drop shape (small oval at end)
            ctx.beginPath();
            ctx.ellipse(d.x, d.y, d.thickness * 0.6, d.len * 0.15, 0, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(150, 220, 220, ${d.opacity * 0.7})`;
            ctx.fill();

            // At bottom: Splash + Reset
            if (d.y > h - 30) {
                splashes.push({
                    x: d.x,
                    y: h - 30,
                    r: 0,
                    maxR: 6 + Math.random() * 10,
                    opacity: 0.4 + Math.random() * 0.3,
                    speed: 0.3 + Math.random() * 0.2,
                });

                ripples.push({
                    x: d.x,
                    y: h - 28,
                    r: 0,
                    maxR: 15 + Math.random() * 20,
                    opacity: 0.3,
                    speed: 0.4 + Math.random() * 0.3,
                });

                d.y = -d.len - Math.random() * canvas.height * 0.3;
                d.x = Math.random() * w;
                d.speed = 2 + Math.random() * 4;
            }
        });

        // Draw splashes
        splashes = splashes.filter(s => {
            s.r += s.speed;
            s.opacity -= 0.015;

            if (s.opacity <= 0) return false;

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(150, 220, 220, ${s.opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            return true;
        });

        // Draw ripples
        ripples = ripples.filter(r => {
            r.r += r.speed;
            r.opacity -= 0.008;

            if (r.opacity <= 0) return false;

            ctx.beginPath();
            ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(73, 146, 154, ${r.opacity * 0.6})`;
            ctx.lineWidth = 1;
            ctx.stroke();

            return true;
        });

        animFrame = requestAnimationFrame(animate);
    }

    return () => {
        if (animFrame) cancelAnimationFrame(animFrame);
        observer.disconnect();
        window.removeEventListener('resize', resize);
        canvas.remove();
    };
}
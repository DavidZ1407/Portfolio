/* ========================================= */
/* MODAL PARTICLE SYSTEM                      */
/* Tiny dust, debris, micro bubbles           */
/* Performance optimized for 60fps            */
/* ========================================= */

/**
 * Lightweight particle system for modal
 * - Tiny dust particles (barely visible)
 * - Occasional micro bubbles
 * - Subtle upward movement
 * - Performance optimized
 */

export function initModalParticles(canvas) {
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const particles = [];
    const maxParticles = 35; // Balanced for performance
    let animationId = null;
    let isActive = false;
    
    function resize() {
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
        ctx.scale(dpr, dpr);
    }
    
    function createParticle() {
        const isBubble = Math.random() > 0.5; // 50% bubbles
        return {
            x: Math.random() * canvas.width,
            y: canvas.height + 10,
            size: isBubble ? Math.random() * 2 + 1.5 : Math.random() * 1 + 0.3,
            speedY: isBubble ? Math.random() * 0.4 + 0.2 : Math.random() * 0.2 + 0.1,
            speedX: (Math.random() - 0.5) * 0.3,
            opacity: isBubble ? Math.random() * 0.5 + 0.3 : Math.random() * 0.2 + 0.1,
            type: isBubble ? 'bubble' : 'dust',
            glow: isBubble && Math.random() > 0.5 // 50% of bubbles glow
        };
    }
    
    function init() {
        resize();
        particles.length = 0;
        for (let i = 0; i < maxParticles; i++) {
            const p = createParticle();
            p.y = Math.random() * canvas.height; // Distribute initially
            particles.push(p);
        }
    }
    
    function animate() {
        if (!isActive) {
            animationId = requestAnimationFrame(animate);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            
            // Move
            p.y -= p.speedY;
            p.x += p.speedX;
            
            // Remove if off screen
            if (p.y < -10) {
                particles[i] = createParticle();
                continue;
            }
            
            // Draw
            ctx.beginPath();
            if (p.type === 'bubble') {
                // Soft glowing bubble with radial gradient
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `rgba(139, 224, 232, ${p.opacity * 0.3})`);
                gradient.addColorStop(0.5, `rgba(139, 224, 232, ${p.opacity * 0.6})`);
                gradient.addColorStop(1, `rgba(139, 224, 232, 0)`);
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                // Soft outer glow
                if (p.glow) {
                    const glowGradient = ctx.createRadialGradient(p.x, p.y, p.size * 0.5, p.x, p.y, p.size * 2);
                    glowGradient.addColorStop(0, `rgba(139, 224, 232, ${p.opacity * 0.15})`);
                    glowGradient.addColorStop(1, `rgba(139, 224, 232, 0)`);
                    
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = glowGradient;
                    ctx.fill();
                }
            } else {
                // Soft dust particle with radial gradient
                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                gradient.addColorStop(0, `rgba(201, 168, 97, ${p.opacity * 0.4})`);
                gradient.addColorStop(1, `rgba(201, 168, 97, 0)`);
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            }
        }
        
        animationId = requestAnimationFrame(animate);
    }
    
    function start() {
        if (isActive) return;
        isActive = true;
        init();
        if (!animationId) {
            animationId = requestAnimationFrame(animate);
        }
    }
    
    function stop() {
        isActive = false;
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.length = 0;
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        if (isActive) resize();
    }, { passive: true });
    
    return { start, stop };
}
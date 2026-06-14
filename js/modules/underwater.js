/* ========================================= */
/* MODULE - UNDERWATER ATMOSPHERE */
/* Deep Sea Anomaly - Procedural energy      */
/* sphere with simplex noise deformation,     */
/* fresnel glow, wireframe overlay,           */
/* flow map distortion, bioluminescence       */
/* ========================================= */

import { debounce, cleanupRegistry } from '../utils/helpers.js';
import { smoothLerp } from '../utils/smooth.js';

/* ========================================= */
/* SIMPLEX NOISE 3D (compact implementation) */
/* ========================================= */
const SimplexNoise = (() => {
    const F3 = 1 / 3;
    const G3 = 1 / 6;
    const grad3 = [
        [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
        [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
        [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];

    class SimplexNoise {
        constructor(seed) {
            this.perm = new Uint8Array(512);
            this.permMod12 = new Uint8Array(512);
            const p = new Uint8Array(256);
            for (let i = 0; i < 256; i++) p[i] = i;
            // Fisher-Yates shuffle with seed
            let s = seed || Math.random() * 65536;
            for (let i = 255; i > 0; i--) {
                s = (s * 16807 + 0) % 2147483647;
                const j = s % (i + 1);
                [p[i], p[j]] = [p[j], p[i]];
            }
            for (let i = 0; i < 512; i++) {
                this.perm[i] = p[i & 255];
                this.permMod12[i] = this.perm[i] % 12;
            }
        }

        noise3D(x, y, z) {
            const s = (x + y + z) * F3;
            const i = Math.floor(x + s);
            const j = Math.floor(y + s);
            const k = Math.floor(z + s);
            const t = (i + j + k) * G3;
            const X0 = i - t, Y0 = j - t, Z0 = k - t;
            const x0 = x - X0, y0 = y - Y0, z0 = z - Z0;

            let i1, j1, k1, i2, j2, k2;
            if (x0 >= y0) {
                if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
                else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
                else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
            } else {
                if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
                else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
                else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
            }

            const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
            const x2 = x0 - i2 + 2*G3, y2 = y0 - j2 + 2*G3, z2 = z0 - k2 + 2*G3;
            const x3 = x0 - 1 + 3*G3, y3 = y0 - 1 + 3*G3, z3 = z0 - 1 + 3*G3;

            const ii = i & 255, jj = j & 255, kk = k & 255;
            const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]];
            const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]];
            const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]];
            const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]];

            let n0, n1, n2, n3;
            let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
            n0 = t0 < 0 ? 0 : (t0 *= t0, t0 * t0 * (grad3[gi0][0]*x0 + grad3[gi0][1]*y0 + grad3[gi0][2]*z0));
            let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
            n1 = t1 < 0 ? 0 : (t1 *= t1, t1 * t1 * (grad3[gi1][0]*x1 + grad3[gi1][1]*y1 + grad3[gi1][2]*z1));
            let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
            n2 = t2 < 0 ? 0 : (t2 *= t2, t2 * t2 * (grad3[gi2][0]*x2 + grad3[gi2][1]*y2 + grad3[gi2][2]*z2));
            let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
            n3 = t3 < 0 ? 0 : (t3 *= t3, t3 * t3 * (grad3[gi3][0]*x3 + grad3[gi3][1]*y3 + grad3[gi3][2]*z3));

            return 32 * (n0 + n1 + n2 + n3);
        }

        // Fractal Brownian Motion (octaves)
        fbm(x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
            let value = 0, amplitude = 1, frequency = 1, max = 0;
            for (let i = 0; i < octaves; i++) {
                value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
                max += amplitude;
                amplitude *= gain;
                frequency *= lacunarity;
            }
            return value / max;
        }
    }

    return SimplexNoise;
})();

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
        width: 260px;
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

    // Simplex noise instance
    const noise = new SimplexNoise(42);

    // Sphere state
    let sphereY = 0;
    let sphereTargetY = 0;
    let sphereEnergy = 0;
    let trail = [];
    let particles = [];
    let bubbles = [];
    let currentNodeIndex = -1;

    // Shared line path function — returns X position of the energy line at a given Y
    function getLineXAtY(y, nodes) {
        if (nodes.length < 2) return 130;
        const startY = nodes[0].y;
        const endY = nodes[nodes.length - 1].y;
        const totalHeight = endY - startY + 60;
        const t = (y - (startY - 30)) / totalHeight;
        const clampedT = Math.max(0, Math.min(1, t));
        const centerX = 130;
        const sag = Math.sin(clampedT * Math.PI) * 3;
        const sway1 = Math.sin(clampedT * Math.PI * 1.3 + time * 0.08) * 5;
        const sway2 = Math.sin(clampedT * Math.PI * 2.7 + time * 0.05 + 1.5) * 2.5;
        const drift = Math.sin(time * 0.04 + clampedT * 1.5) * 1.5;
        return centerX + sag + sway1 + sway2 + drift;
    }

    // Sphere config
    const SPHERE_RADIUS = 20;
    const LAT_LINES = 12;
    const LON_LINES = 16;
    const NOISE_SCALE = 0.8;
    const NOISE_SPEED = 0.35;
    const DISPLACEMENT_AMOUNT = 4.0;
    const FLOW_SPEED = 0.2;

    // Intersection Observer
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
        canvas.width = 260;
        canvas.height = rect.height;
    }

    const debouncedResize = debounce(resize, 150);
    window.addEventListener('resize', debouncedResize);
    setTimeout(resize, 50);

    function initParticles() {
        particles = [];
        bubbles = [];
        const w = canvas.width || 260;

        for (let i = 0; i < 14; i++) {
            particles.push({
                x: 40 + Math.random() * (w - 80),
                y: Math.random() * canvas.height,
                r: 0.3 + Math.random() * 0.9,
                color: Math.random() > 0.3 ? '73, 146, 154' : '120, 200, 215',
                floatAmp: 4 + Math.random() * 10,
                floatSpeed: 0.15 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
                maxOpacity: 0.06 + Math.random() * 0.15,
                opacity: 0,
                delay: Math.random() * 5,
            });
        }

        for (let i = 0; i < 5; i++) {
            bubbles.push({
                x: 60 + Math.random() * 140,
                y: Math.random() * canvas.height,
                r: 0.5 + Math.random() * 1.5,
                speed: 0.08 + Math.random() * 0.2,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.01 + Math.random() * 0.02,
                opacity: 0.04 + Math.random() * 0.08,
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
        time += 0.016;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const nodes = getNodePositions();
        if (nodes.length === 0) {
            animFrame = requestAnimationFrame(animate);
            return;
        }

        const centerX = 130;
        drawEnergyLine(centerX, nodes);
        updateSpherePosition(nodes);
        drawProceduralSphere(centerX);
        drawTrail(centerX);
        drawParticles();
        drawBubbles();

        animFrame = requestAnimationFrame(animate);
    }

    function drawEnergyLine(centerX, nodes) {
        if (nodes.length < 2) return;
        const startY = nodes[0].y;
        const endY = nodes[nodes.length - 1].y;
        const totalHeight = endY - startY + 60;
        const segments = 90;

        // === ANCIENT RUIN CABLE / PIPE ===
        // Build the path with heavy, ancient sway — like a corroded pipe
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const y = (startY - 30) + t * totalHeight;
            
            // Heavy, slow sway — old pipe sagging under its own weight
            const sag = Math.sin(t * Math.PI) * 3; // natural droop in the middle
            const sway1 = Math.sin(t * Math.PI * 1.3 + time * 0.08) * 5;
            const sway2 = Math.sin(t * Math.PI * 2.7 + time * 0.05 + 1.5) * 2.5;
            // Very slow drift — ancient structure barely moving
            const drift = Math.sin(time * 0.04 + t * 1.5) * 1.5;
            const x = centerX + sag + sway1 + sway2 + drift;
            points.push({ x, y, t });
        }

        // Layer 1: Deep underwater ambient glow (widest, faintest)
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            if (i === 0) ctx.moveTo(points[i].x, points[i].y);
            else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = 'rgba(40, 80, 90, 0.025)';
        ctx.lineWidth = 18;
        ctx.stroke();

        // Layer 2: Corroded pipe shadow / depth
        ctx.beginPath();
        for (let i = 0; i < points.length; i++) {
            if (i === 0) ctx.moveTo(points[i].x, points[i].y);
            else ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.strokeStyle = 'rgba(30, 60, 70, 0.04)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Layer 3: Main pipe body — thick, segmented, corroded look
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const t = p0.t;
            
            // Corroded texture — width varies along the pipe
            const corrWidth = Math.sin(t * Math.PI * 18) * 0.3 
                            + Math.sin(t * Math.PI * 30 + 2) * 0.15;
            const pipeWidth = 2.2 + corrWidth;
            
            // Corrosion pattern — alternating darker/lighter segments
            const segment = Math.sin(t * Math.PI * 25);
            const isDark = segment > 0.3;
            
            // Base pipe color — dark teal patina
            let r, g, b, alpha;
            if (isDark) {
                // Corroded section — darker, more opaque
                r = 45; g = 100; b = 110;
                alpha = 0.12 + Math.sin(t * Math.PI * 40 + time * 0.1) * 0.03;
            } else {
                // Less corroded — slightly brighter
                r = 65; g = 130; b = 140;
                alpha = 0.08 + Math.sin(t * Math.PI * 40 + time * 0.1) * 0.02;
            }
            
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
            ctx.lineWidth = pipeWidth;
            ctx.stroke();
        }

        // Layer 4: Pipe highlight edge (thin bright line on one side)
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const t = p0.t;
            
            // Faint highlight — like light catching the edge of a metal pipe
            const highlight = Math.sin(t * Math.PI * 8 + time * 0.06) * 0.5 + 0.5;
            const alpha = 0.03 + highlight * 0.04;
            
            ctx.beginPath();
            ctx.moveTo(p0.x - 0.5, p0.y);
            ctx.lineTo(p1.x - 0.5, p1.y);
            ctx.strokeStyle = `rgba(120, 190, 200, ${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }

        // Layer 5: Barnacle / growth nodes — small bumps along the pipe
        for (let i = 0; i < points.length; i += 3) {
            const p = points[i];
            const t = p.t;
            
            // Pseudo-random barnacle placement
            const barnacle = Math.sin(t * 99.7 + 42) * 0.5 + 0.5;
            if (barnacle > 0.6) {
                const side = Math.sin(t * 77.3) > 0 ? 1 : -1;
                const bx = p.x + side * (2 + barnacle * 2);
                const by = p.y;
                const bSize = 1 + barnacle * 1.5;
                
                ctx.beginPath();
                ctx.arc(bx, by, bSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(60, 110, 120, ${0.04 + barnacle * 0.03})`;
                ctx.fill();
            }
        }

        // Layer 6: Energy leak points — faint glow spots where the pipe is cracked
        const leakCount = 4;
        for (let s = 0; s < leakCount; s++) {
            const leakT = (s + 0.5) / leakCount;
            const leakIdx = Math.floor(leakT * (points.length - 1));
            const p = points[leakIdx];
            
            // Pulsing energy leak — very subtle
            const leakPulse = Math.sin(time * 0.7 + s * 2.5) * 0.5 + 0.5;
            const leakSize = 6 + leakPulse * 4;
            
            const leakGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, leakSize);
            leakGrad.addColorStop(0, `rgba(100, 200, 215, ${0.03 + leakPulse * 0.02})`);
            leakGrad.addColorStop(0.5, `rgba(73, 146, 154, ${0.015})`);
            leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = leakGrad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, leakSize, 0, Math.PI * 2);
            ctx.fill();
            
            // Tiny bright core at leak point
            ctx.fillStyle = `rgba(160, 230, 240, ${0.06 + leakPulse * 0.04})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 0.8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Caustic light patches at node positions — underwater light pooling
        for (let i = 0; i < nodes.length; i++) {
            const nodeY = nodes[i].y;
            const size = 25 + Math.sin(time * 0.6 + i * 3.5) * 10;
            
            const grad = ctx.createRadialGradient(centerX, nodeY, 0, centerX, nodeY, size);
            grad.addColorStop(0, `rgba(50, 100, 110, ${0.03 + Math.sin(time * 0.4 + i) * 0.01})`);
            grad.addColorStop(0.4, `rgba(73, 146, 154, ${0.015})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(centerX, nodeY, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function updateSpherePosition(nodes) {
        // Use scroll progress through the section to determine target node
        const sectionRect = section.getBoundingClientRect();
        const sectionHeight = section.offsetHeight;
        const sectionTop = sectionRect.top;
        
        // Calculate scroll progress: 0 = section just entered viewport, 1 = section leaving
        const scrollProgress = Math.max(0, Math.min(1, 
            -sectionTop / (sectionHeight - window.innerHeight)
        ));
        
        // Map scroll progress to node index
        const nodeCount = nodes.length;
        const rawIndex = scrollProgress * (nodeCount - 1);
        const targetIndex = Math.round(rawIndex);
        
        if (targetIndex >= 0 && targetIndex < nodeCount) {
            sphereTargetY = nodes[targetIndex].y;
            
            if (targetIndex !== currentNodeIndex) {
                currentNodeIndex = targetIndex;
                sphereEnergy = 1.5;
            }
        }
        
        // Slow, smooth lerp for that beautiful traveling effect
        sphereY = smoothLerp(sphereY, sphereTargetY, 0.03);
        if (sphereEnergy > 0) sphereEnergy -= 0.01;
        trail.push({ y: sphereY, opacity: 0.2, age: 0 });
        if (trail.length > 25) trail.shift();

        // Update sphere-near class on timeline items
        // Pearl nodes only illuminate when sphere is actually close
        const items = container.querySelectorAll('.timeline_item');
        const sphereScreenY = sphereY; // relative to container
        items.forEach((item, i) => {
            if (i < nodes.length) {
                const dist = Math.abs(nodes[i].y - sphereScreenY);
                if (dist < 60) {
                    item.classList.add('sphere-near');
                } else {
                    item.classList.remove('sphere-near');
                }
            }
        });
    }

    function findClosestNodeIndex(y, nodes) {
        let closest = 0, minDist = Infinity;
        nodes.forEach((node, i) => {
            const dist = Math.abs(node.y - y);
            if (dist < minDist) { minDist = dist; closest = i; }
        });
        return closest;
    }

    /* ========================================= */
    /* PROCEDURAL SPHERE with simplex noise      */
    /* ========================================= */
    function drawProceduralSphere(centerX) {
        const bobY = Math.sin(time * 0.7) * 1.5;
        const cy = sphereY + bobY;
        // Follow the line's X position at the sphere's Y
        const cx = getLineXAtY(sphereY, getNodePositions());

        const energy = Math.max(0, sphereEnergy);
        const breathe = 0.5 + Math.sin(time * 1.5) * 0.15;
        const radius = SPHERE_RADIUS + energy * 3 + Math.sin(time * 1.2) * 1.5;

        // Rotation
        const rotY = time * 0.25;
        const rotX = time * 0.12 + Math.sin(time * 0.3) * 0.1;

        // Generate vertices with simplex noise displacement
        const vertices = [];
        for (let lat = 0; lat <= LAT_LINES; lat++) {
            const theta = (lat / LAT_LINES) * Math.PI;
            for (let lon = 0; lon <= LON_LINES; lon++) {
                const phi = (lon / LON_LINES) * Math.PI * 2;

                // Base position
                let px = radius * Math.sin(theta) * Math.cos(phi);
                let py = radius * Math.cos(theta);
                let pz = radius * Math.sin(theta) * Math.sin(phi);

                // Simplex noise displacement (multi-octave)
                const nx = px * NOISE_SCALE;
                const ny = py * NOISE_SCALE;
                const nz = pz * NOISE_SCALE;
                const noiseVal = noise.fbm(
                    nx + time * NOISE_SPEED,
                    ny + time * NOISE_SPEED * 0.7,
                    nz + time * NOISE_SPEED * 0.5,
                    4, 2.0, 0.5
                );
                const disp = noiseVal * DISPLACEMENT_AMOUNT * (1 + energy * 0.6);

                // Flow map distortion (vertices drift along surface)
                const flowX = noise.noise3D(px * 0.5 + time * FLOW_SPEED, py * 0.5, pz * 0.5) * 1.5;
                const flowY = noise.noise3D(px * 0.5, py * 0.5 + time * FLOW_SPEED, pz * 0.5) * 1.5;
                const flowZ = noise.noise3D(px * 0.5, py * 0.5, pz * 0.5 + time * FLOW_SPEED) * 1.5;

                // Apply displacement along normal + flow
                const len = Math.sqrt(px * px + py * py + pz * pz) || 1;
                px += (px / len) * disp + flowX;
                py += (py / len) * disp + flowY;
                pz += (pz / len) * disp + flowZ;

                // Rotate Y
                const cosRy = Math.cos(rotY), sinRy = Math.sin(rotY);
                let rx = px * cosRy - pz * sinRy;
                let rz = px * sinRy + pz * cosRy;
                let ry = py;

                // Tilt X
                const cosRx = Math.cos(rotX), sinRx = Math.sin(rotX);
                let ty = ry * cosRx - rz * sinRx;
                let tz = ry * sinRx + rz * cosRx;

                // Perspective projection
                const fov = 130;
                const z = tz + fov + 40;
                const scale = fov / z;
                const sx = cx + rx * scale;
                const sy = cy + ty * scale;

                // Normal for fresnel
                const normalX = px / len, normalY = py / len, normalZ = pz / len;
                // View direction (simplified: toward camera)
                const viewX = 0, viewY = 0, viewZ = -1;
                const dot = normalX * viewX + normalY * viewY + normalZ * viewZ;
                const fresnel = 1 - Math.abs(dot);
                const fresnelPow = fresnel * fresnel; // squared for sharper edge glow

                vertices.push({
                    x: sx, y: sy, z: tz,
                    lat, lon,
                    fresnel: fresnelPow,
                    noiseVal: noiseVal,
                });
            }
        }

        // ---- TRANSLUCENT SURFACE FILL ----
        // Draw filled quads between vertices for translucent surface
        for (let lat = 0; lat < LAT_LINES; lat++) {
            for (let lon = 0; lon < LON_LINES; lon++) {
                const i00 = lat * (LON_LINES + 1) + lon;
                const i01 = lat * (LON_LINES + 1) + lon + 1;
                const i10 = (lat + 1) * (LON_LINES + 1) + lon;
                const i11 = (lat + 1) * (LON_LINES + 1) + lon + 1;

                const v00 = vertices[i00], v01 = vertices[i01];
                const v10 = vertices[i10], v11 = vertices[i11];

                // Average depth for this quad
                const avgZ = (v00.z + v01.z + v10.z + v11.z) / 4;
                const depthFactor = Math.max(0, Math.min(1, (avgZ + 40) / 200));

                // Average fresnel for this quad
                const avgFresnel = (v00.fresnel + v01.fresnel + v10.fresnel + v11.fresnel) / 4;

                // Translucent fill
                const fillAlpha = (0.015 + avgFresnel * 0.04 + energy * 0.01) * depthFactor;
                ctx.beginPath();
                ctx.moveTo(v00.x, v00.y);
                ctx.lineTo(v01.x, v01.y);
                ctx.lineTo(v11.x, v11.y);
                ctx.lineTo(v10.x, v10.y);
                ctx.closePath();
                ctx.fillStyle = `rgba(73, 146, 154, ${fillAlpha})`;
                ctx.fill();
            }
        }

        // ---- WIREFRAME OVERLAY ----
        // Longitude lines
        for (let lon = 0; lon < LON_LINES; lon++) {
            ctx.beginPath();
            for (let lat = 0; lat <= LAT_LINES; lat++) {
                const v = vertices[lat * (LON_LINES + 1) + lon];
                if (lat === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            }
            const lineAlpha = 0.06 + breathe * 0.05 + energy * 0.03;
            ctx.strokeStyle = `rgba(100, 200, 215, ${lineAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }

        // Latitude lines
        for (let lat = 1; lat < LAT_LINES; lat++) {
            ctx.beginPath();
            for (let lon = 0; lon <= LON_LINES; lon++) {
                const v = vertices[lat * (LON_LINES + 1) + lon];
                if (lon === 0) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            }
            const lineAlpha = 0.05 + breathe * 0.04 + energy * 0.02;
            ctx.strokeStyle = `rgba(73, 146, 154, ${lineAlpha})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
        }

        // ---- VERTEX DOTS with fresnel ----
        for (let lat = 0; lat <= LAT_LINES; lat++) {
            for (let lon = 0; lon <= LON_LINES; lon++) {
                const v = vertices[lat * (LON_LINES + 1) + lon];
                const depthFactor = (v.z + 40) / 200;
                const dotAlpha = Math.max(0.03, Math.min(0.4, depthFactor * 0.35 + v.fresnel * 0.15 + energy * 0.08));
                const dotSize = 0.4 + depthFactor * 0.6 + v.fresnel * 0.3;

                ctx.beginPath();
                ctx.arc(v.x, v.y, dotSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(150, 220, 235, ${dotAlpha})`;
                ctx.fill();
            }
        }

        // ---- FRESNEL GLOW (edge glow ring) ----
        // Draw a ring of glow around the sphere edges
        const fresnelGlowRadius = radius + 4 + energy * 3;
        const fresnelGrad = ctx.createRadialGradient(cx, cy, radius * 0.6, cx, cy, fresnelGlowRadius);
        fresnelGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        fresnelGrad.addColorStop(0.5, `rgba(73, 146, 154, ${0.02 * breathe})`);
        fresnelGrad.addColorStop(0.8, `rgba(100, 200, 215, ${0.06 * breathe + energy * 0.03})`);
        fresnelGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fresnelGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, fresnelGlowRadius, 0, Math.PI * 2);
        ctx.fill();

        // ---- GLOWING CYAN CORE ----
        const coreRadius = 5 + Math.sin(time * 2) * 0.8 + energy * 2;

        // Outer glow
        const outerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius + 12 + energy * 8);
        outerGlow.addColorStop(0, `rgba(73, 146, 154, ${0.07 * breathe + energy * 0.04})`);
        outerGlow.addColorStop(0.35, `rgba(100, 200, 215, ${0.035 * breathe})`);
        outerGlow.addColorStop(0.7, `rgba(73, 146, 154, ${0.01 * breathe})`);
        outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 12 + energy * 8, 0, Math.PI * 2);
        ctx.fill();

        // Core glow
        const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreRadius + 6);
        coreGrad.addColorStop(0, `rgba(180, 240, 250, ${0.5 * breathe + energy * 0.2})`);
        coreGrad.addColorStop(0.3, `rgba(100, 200, 215, ${0.3 * breathe + energy * 0.1})`);
        coreGrad.addColorStop(0.6, `rgba(73, 146, 154, ${0.12 * breathe})`);
        coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius + 6, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        const innerGrad = ctx.createRadialGradient(cx - 0.5, cy - 0.8, 0, cx, cy, coreRadius);
        innerGrad.addColorStop(0, `rgba(220, 250, 255, ${0.85 * breathe + energy * 0.15})`);
        innerGrad.addColorStop(0.4, `rgba(150, 230, 240, ${0.55 * breathe})`);
        innerGrad.addColorStop(0.7, `rgba(100, 200, 215, ${0.3 * breathe})`);
        innerGrad.addColorStop(1, 'rgba(73, 146, 154, 0)');
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
        ctx.fill();

        // Specular
        const specGrad = ctx.createRadialGradient(cx - 1, cy - 1.5, 0, cx - 0.3, cy - 0.5, 2.5);
        specGrad.addColorStop(0, `rgba(255, 255, 255, ${0.65 * breathe})`);
        specGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = specGrad;
        ctx.beginPath();
        ctx.arc(cx - 0.3, cy - 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // ---- PULSE WAVE ----
        if (energy > 0.4) {
            const waveRadius = (1.8 - energy) * 50 + radius;
            const waveOpacity = (energy - 0.4) * 0.12;
            ctx.beginPath();
            ctx.arc(cx, cy, waveRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 200, 215, ${waveOpacity})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
        }

        // ---- EMIT SURFACE PARTICLES ----
        if (sphereEnergy > 0.15) {
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const elev = (Math.random() - 0.5) * Math.PI;
                const dist = radius * 0.9;
                particles.push({
                    x: cx + Math.cos(angle) * Math.cos(elev) * dist,
                    y: cy + Math.sin(elev) * dist,
                    r: 0.3 + Math.random() * 0.6,
                    color: Math.random() > 0.5 ? '150, 220, 230' : '100, 200, 215',
                    life: 25 + Math.random() * 30,
                    age: 0,
                    maxOpacity: 0.2 + Math.random() * 0.2,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6 - 0.2,
                    floatAmp: 0, floatSpeed: 0, phase: 0, delay: 0,
                });
            }
        }
    }

    function drawTrail(centerX) {
        trail.forEach((point) => {
            point.opacity -= 0.006;
            point.age++;
            if (point.opacity <= 0) return;
            const sway = Math.sin(point.age * 0.012 + point.y * 0.006) * 3;
            const x = centerX + sway;
            const grad = ctx.createRadialGradient(x, point.y, 0, x, point.y, 2);
            grad.addColorStop(0, `rgba(150, 220, 230, ${point.opacity * 0.15})`);
            grad.addColorStop(1, 'rgba(73, 146, 154, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, point.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        while (trail.length > 0 && trail[0].opacity <= 0) trail.shift();
    }

    function drawParticles() {
        particles.forEach(p => {
            if (time < p.delay) return;
            if (p.life !== undefined) {
                p.age++;
                if (p.age > p.life) { p.opacity = 0; return; }
                p.opacity = p.maxOpacity * (1 - p.age / p.life);
            } else {
                p.opacity = Math.min(p.maxOpacity, p.opacity + 0.003);
            }
            const floatY = p.y + Math.sin(time * p.floatSpeed + p.phase) * p.floatAmp;
            const alpha = p.opacity * (0.3 + 0.7 * Math.sin(time * 0.35 + p.phase));
            ctx.fillStyle = `rgba(${p.color}, ${alpha * 0.04})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r + 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, floatY, p.r, 0, Math.PI * 2);
            ctx.fill();
        });
        particles = particles.filter(p => p.life === undefined || p.opacity > 0.01);
    }

    function drawBubbles() {
        bubbles.forEach(b => {
            b.wobble += b.wobbleSpeed;
            b.y -= b.speed;
            if (b.y < -10) { b.y = canvas.height + 10; b.x = 60 + Math.random() * 140; }
            b.x += Math.sin(b.wobble) * 0.3;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(100, 180, 200, ${b.opacity})`;
            ctx.lineWidth = 0.4;
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(200, 240, 250, ${b.opacity * 0.5})`;
            ctx.fill();
        });
    }

    cleanupRegistry.register(() => {
        isActive = false;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = null;
        window.removeEventListener('resize', debouncedResize);
        observer.disconnect();
        canvas.remove();
    });
}
/* ========================================= */
/* CENTRALIZED ANIMATION MANAGER            */
/* Single rAF loop for ALL canvas modules   */
/* ========================================= */

/* Max. DeltaTime (Sekunden) pro Frame. Verhindert grosse Zeitspruenge
   (z.B. nach Tab-Wechsel), die die Simulation "explodieren" lassen. */
const MAX_FRAME_DELTA_SECONDS = 0.05;

/**
 * AnimationManager - Single requestAnimationFrame loop
 * that drives all canvas/webgl animations.
 * 
 * Benefits:
 * - ONE rAF callback instead of 14+
 * - Shared timestamp (performance.now())
 * - Automatic pause on tab hidden
 * - Centralized cleanup
 */

class AnimationManager {
    constructor() {
        this.callbacks = new Map();
        this.callbackId = 0;
        this.isRunning = false;
        this.animFrameId = null;
        this.lastFrameTime = 0;
        this._boundAnimate = this._animate.bind(this);
        this._boundVisibility = this._onVisibilityChange.bind(this);
        this._started = false;
    }

    /**
     * Register an animation callback
     * @param {Function} fn - callback(now, deltaTime) 
     * @returns {number} callback ID (for unregister)
     */
    register(fn) {
        if (typeof fn !== 'function') return -1;
        const id = ++this.callbackId;
        this.callbacks.set(id, fn);
        
        // Auto-start on first registration
        if (!this._started) {
            this._started = true;
            document.addEventListener('visibilitychange', this._boundVisibility);
            this.start();
        }
        
        return id;
    }

    /**
     * Unregister a callback by ID
     */
    unregister(id) {
        this.callbacks.delete(id);
        if (this.callbacks.size === 0) {
            this.stop();
        }
    }

    /**
     * Start the animation loop
     */
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }

    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    /**
     * Pause all callbacks (e.g. tab hidden)
     */
    pause() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.lastFrameTime = 0; // Prevent time jump on resume
    }

    /**
     * Resume after pause
     */
    resume() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = 0; // Reset to avoid huge dt
        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }

    /**
     * Internal animation loop
     */
    _animate(now) {
        if (!this.isRunning) return;
        
        // Calculate delta time (capped at 50ms to prevent spiral of death)
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const dt = Math.min((now - this.lastFrameTime) / 1000, MAX_FRAME_DELTA_SECONDS);
        this.lastFrameTime = now;

        // Call all registered callbacks
        this.callbacks.forEach(fn => {
            try {
                fn(now, dt);
            } catch (e) {
                console.warn('[AnimationManager] Callback error:', e);
            }
        });

        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }

    /**
     * Handle tab visibility change
     */
    _onVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }

    /**
     * Destroy the manager (cleanup)
     */
    destroy() {
        this.stop();
        document.removeEventListener('visibilitychange', this._boundVisibility);
        this.callbacks.clear();
        this._started = false;
    }
}

// Singleton instance
export const animationManager = new AnimationManager();

/**
 * Helper: wrap a module's render function to register with the animation manager.
 * Returns a cleanup function.
 */
export function registerAnimation(fn) {
    const id = animationManager.register(fn);
    return () => animationManager.unregister(id);
}

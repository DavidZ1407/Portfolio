/* ==========================================================================
   FILE: js/utils/animation_manager.js
   DESCRIPTION: Central animation manager that registers canvas/WebGL animations and pauses them when off-screen.
   ========================================================================== */

import { MAX_FRAME_DELTA_SECONDS } from '../constants/ui.js';

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

    
    register(fn) {
        if (typeof fn !== 'function') return -1;
        const id = ++this.callbackId;
        this.callbacks.set(id, fn);

        
        if (!this._started) {
            this._started = true;
            document.addEventListener('visibilitychange', this._boundVisibility);
            this.start();
        }

        return id;
    }


    unregister(id) {
        this.callbacks.delete(id);
        if (this.callbacks.size === 0) {
            this.stop();
        }
    }


    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = performance.now();
        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }


    stop() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }


    pause() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
        this.lastFrameTime = 0; 
    }

    resume() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.lastFrameTime = 0; 
        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }


    _animate(now) {
        if (!this.isRunning) return;

        
        if (!this.lastFrameTime) this.lastFrameTime = now;
        const dt = Math.min((now - this.lastFrameTime) / 1000, MAX_FRAME_DELTA_SECONDS);
        this.lastFrameTime = now;

        this.callbacks.forEach(fn => {
            try {
                fn(now, dt);
            } catch (e) {
                console.warn('[AnimationManager] Callback error:', e);
            }
        });

        this.animFrameId = requestAnimationFrame(this._boundAnimate);
    }


    _onVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }


    destroy() {
        this.stop();
        document.removeEventListener('visibilitychange', this._boundVisibility);
        this.callbacks.clear();
        this._started = false;
    }
}

export const animationManager = new AnimationManager();




export function registerAnimation(fn) {
    const id = animationManager.register(fn);
    return () => animationManager.unregister(id);
}

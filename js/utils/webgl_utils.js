/**
 * File: webgl_utils.js
 * Description: Shared WebGL feature detection for all shader modules, so
 * unsupported mobile devices skip WebGL initialization gracefully instead of
 * hitting "THREE.WebGLRenderer: Error creating WebGL context".
 */

let cachedSupport = null;

/**
 * Detect WebGL support once and cache the result.
 * A probe context is created on a detached canvas (invisible, no layout
 * impact) and released immediately, so calling this never leaves GPU
 * resources behind and never mutates the page.
 * @param {string[]} [contextIds] context names to probe (webgl2 preferred)
 * @returns {boolean} true if at least one WebGL context type can be created
 */
export function isWebGLAvailable(contextIds = ['webgl2', 'webgl']) {
    // Cache the probe result: context support never changes within a session,
    // and repeated context creation is expensive on low-end mobile GPUs.
    if (cachedSupport !== null) return cachedSupport;
    try {
        const probe = document.createElement('canvas');
        cachedSupport = contextIds.some((id) => {
            try {
                const ctx = probe.getContext(id);
                if (!ctx) return false;
                // Release the probe context right away to free GPU memory on
                // memory-constrained devices.
                const lose = ctx.getExtension('WEBGL_lose_context');
                if (lose) lose.loseContext();
                return true;
            } catch (e) {
                // Some browsers throw for unknown context ids - treat as unsupported.
                return false;
            }
        });
    } catch (e) {
        cachedSupport = false;
    }
    return cachedSupport;
}

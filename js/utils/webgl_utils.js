/* ==========================================================================
   FILE: js/utils/webgl_utils.js
   DESCRIPTION: Shared WebGL feature detection so unsupported devices skip shader initialization gracefully.
   ========================================================================== */

let cachedSupport = null;


export function isWebGLAvailable(contextIds = ['webgl2', 'webgl']) {


    if (cachedSupport !== null) return cachedSupport;
    try {
        const probe = document.createElement('canvas');
        cachedSupport = contextIds.some((id) => {
            try {
                const ctx = probe.getContext(id);
                if (!ctx) return false;


                const lose = ctx.getExtension('WEBGL_lose_context');
                if (lose) lose.loseContext();
                return true;
            } catch (e) {

                return false;
            }
        });
    } catch (e) {
        cachedSupport = false;
    }
    return cachedSupport;
}

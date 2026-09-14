/* ==========================================================================
   FILE: js/utils/modal_resume.js
   DESCRIPTION: Staggers the resume of WebGL/canvas effects after the project modal closes.
   ========================================================================== */

const STEP_MS = 40;
const SPAN_MS = 480;


export function getModalResumeElapsed() {
    const body = document.body;
    const stamp = body && body.dataset ? body.dataset.modalResumeAt : null;
    if (!stamp) return -1;
    const elapsed = performance.now() - Number(stamp);



    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > SPAN_MS) {
        delete body.dataset.modalResumeAt;
        return -1;
    }
    return elapsed;
}


export function isModalResumeStagger(slot = 0) {
    const elapsed = getModalResumeElapsed();
    if (elapsed < 0) return false;
    return elapsed < slot * STEP_MS;
}
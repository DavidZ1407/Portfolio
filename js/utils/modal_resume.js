//File: modal_resume.js
//Description: Staggers the resume of WebGL/canvas effects after the project modal closes.
// modal.js stamps body[data-modal-resume-at] when .modal-open is removed; each effect
// polls this helper with its own slot, so they never all render in the same frame.

const STEP_MS = 40;   // ~2-3 frames (60 Hz) between effect slots
const SPAN_MS = 480;  // forget the stamp after the last slot

/**
 * Milliseconds since the modal close started, or -1 when no stagger is
 * currently active (no recent modal close, stamp expired or cleared).
 * Leaves the stamp intact while staggering so several effects can poll it.
 */
export function getModalResumeElapsed() {
    const body = document.body;
    const stamp = body && body.dataset ? body.dataset.modalResumeAt : null;
    if (!stamp) return -1;
    const elapsed = performance.now() - Number(stamp);
    // Treat a bogus/expired stamp (NaN, clock-skew to the future, or older
    // than the stagger window) as "no stagger active" so effects can NEVER be
    // gated forever by a stale timestamp.
    if (!Number.isFinite(elapsed) || elapsed < 0 || elapsed > SPAN_MS) {
        delete body.dataset.modalResumeAt;
        return -1;
    }
    return elapsed;
}

/**
 * True while the effect with the given slot must stay paused after a modal close.
 * @param {number} slot - 0 = resume first, higher = resume later
 */
export function isModalResumeStagger(slot = 0) {
    const elapsed = getModalResumeElapsed();
    if (elapsed < 0) return false;
    return elapsed < slot * STEP_MS;
}
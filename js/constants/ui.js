/**
 * File: ui.js
 * Description: Shared UI constants: breakpoints, animation timings, debounce/throttle intervals, and GPU rendering limits.
 */
export const CANVAS_BACKING_MAX_WIDTH = 2560;

/** Mobile/tablet breakpoint (px). Below this, reduced effects/swarm sizes kick in. */
export const MOBILE_BREAKPOINT = 768;

/** Common debounce delay (ms) for resize/scroll handlers */
export const DEBOUNCE_DELAY_MS = 150;

/** Common throttle interval (ms) for high-frequency handlers */
export const THROTTLE_INTERVAL_MS = 50;

/* ---- Viewport breakpoints (JS side, consistent with css/responsive.css) ---- */

/** Viewport breakpoint: "large" threshold (2056px+). Reduced particle/canvas usage. */
export const LARGE_BREAKPOINT_PX = 2056;

/** Viewport breakpoint: "extra-large" threshold (3000px+). Further quality reduction. */
export const XLARGE_BREAKPOINT_PX = 3000;

/** Viewport breakpoint: 4K displays (3840px+). Lowest quality setting. */
export const FOUR_K_BREAKPOINT_PX = 3840;

/** Viewport breakpoint: laptop-desktop transition (1200px). For adaptive swarm sizes. */
export const TABLET_DESKTOP_BREAKPOINT_PX = 1200;

/** Viewport breakpoint: small-mobile transition (480px). For adaptive quality. */
export const MOBILE_SMALL_BREAKPOINT_PX = 480;

/* ---- Animation & Timing ---- */

/** Max. deltaTime (seconds) per frame. Prevents simulation explosion after tab switch. */
export const MAX_FRAME_DELTA_SECONDS = 0.05;

/** Fixed timestep for shader animations (1/60s ~ 60fps). */
export const FRAME_TIMESTEP = 1 / 60;

/** Precomputed 2pi constant for ctx.arc() calls. */
export const TWO_PI = Math.PI * 2;

/** Default IntersectionObserver threshold for visibility-based animations. */
export const INTERSECTION_THRESHOLD = 0.05;

/** Boot delay (ms) for the initial resize after component mount. */
export const BOOT_DELAY_MS = 50;

/** Resize boot delay (ms) for canvas modules with heavy initialization. */
export const RESIZE_BOOT_DELAY_MS = 100;

/** Larger debounce interval (ms) for heavy resize handlers. */
export const DEBOUNCE_DELAY_LARGE_MS = 200;

/* ---- GPU / Rendering ---- */

/** Max pixel ratio for WebGL shader canvases (GPU load cap). */
export const SHADER_MAX_PIXEL_RATIO = 1.5;

/** Max pixel ratio for the small portal canvas (small area, 2x is fine). */
export const PORTAL_MAX_PIXEL_RATIO = 2;
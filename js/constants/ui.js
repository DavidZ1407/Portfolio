/* ========================================= */
/* CONSTANTS - SHARED UI / RUNTIME LIMITS    */
/* ========================================= */
/* Zentrale Werte, die ueber mehrere Module hinweg
   wiederkehren (Magic Numbers), damit sie an EINEM
   Ort gepflegt werden koennen. */

/** Obergrenze des Canvas-Backing-Stores (px), um grosse Viewports nicht explodieren zu lassen */
export const CANVAS_BACKING_MAX_WIDTH = 2560;

/** Mobil-/Tablet-Breakpoint (px). Unterhalb werden reduzierte Effekte/Swarm-Groessen aktiv. */
export const MOBILE_BREAKPOINT = 768;

/** Ueblicher Debounce-Verzoegerungswert (ms) fuer Resize/Scroll-Handler */
export const DEBOUNCE_DELAY_MS = 150;

/** Uebliches Throttle-Intervall (ms) fuer hochfrequente Handler */
export const THROTTLE_INTERVAL_MS = 50;
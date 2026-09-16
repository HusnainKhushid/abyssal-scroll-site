/**
 * Constants shared by the canvas and the DOM chrome.
 *
 * Kept in their own module with no three.js import, so the preloader,
 * nav and footer can match the canvas exactly while the WebGL bundle
 * stays code-split.
 */

/** Page + canvas clear colour. Additive blending needs this near-black. */
export const BACKGROUND = "#03060a";

/**
 * Set from the backdrop, not by eye: comfortably above the ambient
 * field so it never blooms into itself and washes the page out as you
 * scroll, low enough that the dim grains still glow.
 */
export const BLOOM_THRESHOLD = 0.06;

/** Fallback accent, used before the scroll engine writes the live one. */
export const ACCENT_FALLBACK = "rgb(143 240 216)";

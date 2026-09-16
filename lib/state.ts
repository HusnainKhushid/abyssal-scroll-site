import { SECTIONS } from "./content";
import { makeBlendedField, PRESETS, SECTION_COUNT } from "./field";

export { SECTION_COUNT };

/**
 * One mutable object shared by the DOM scroll layer and the render
 * loop. Deliberately not React state — every field here changes on most
 * frames, and a re-render at that rate eats the frame budget.
 */
export const view = {
  /** 0..1 across the whole stage */
  progress: 0,
  /** index of the section being held / blended away from */
  index: 0,
  /** 0..1 blend from index to index + 1 */
  blend: 0,
  /** 0..1 raw progress inside the active section, before easing */
  local: 0,

  /** pointer in normalised device coords, -1..1 */
  pointerX: 0,
  pointerY: 0,
  /** eased pointer — what the scene follows */
  smoothX: 0,
  smoothY: 0,

  /** scroll energy, 0..1-ish; topped up by the scroll listener */
  velocity: 0,

  ready: false,
  reduced: false,
  /** 0..1 intro assembly */
  intro: 0,

  /**
   * The live blend of the two neighbouring field presets. Written once
   * per frame by the scroll engine and read by every canvas layer, so
   * the layers can never disagree about what section they are in.
   */
  field: makeBlendedField(),
};

/**
 * Fraction of a section spent holding before the field starts moving to
 * the next one. Lower than a morph page would want: these transitions
 * are continuous, so there is nothing to protect, and a long hold just
 * reads as a stall.
 */
export const HOLD = 0.34;

export function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

export function smoothstep(edge0: number, edge1: number, x: number) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Frame-rate independent easing. A raw lerp per frame is not. */
export function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * `raw` is scroll position in section-heights: integer part is the
 * active section, fraction is progress through it.
 */
export function applySectionScroll(raw: number) {
  const r = clamp(raw, 0, SECTION_COUNT);
  const idx = clamp(Math.floor(r), 0, SECTION_COUNT - 1);
  const local = clamp(r - idx, 0, 1);
  view.index = idx;
  view.local = local;
  view.blend = smoothstep(HOLD, 1, local);
  view.progress = clamp(r / SECTION_COUNT, 0, 1);
}

/**
 * Visibility curve for a panel's copy. No fade-*in*: a section's
 * entrance is its own reveal animation, and a scroll-driven fade-in
 * would leave the first section invisible at scroll position zero.
 */
export function contentVisibility(local: number) {
  return 1 - smoothstep(0.46, 0.72, local);
}

/** Interpolated depth readout, in metres. */
export function currentDepth() {
  const a = SECTIONS[view.index]?.depth ?? 0;
  const b = SECTIONS[Math.min(view.index + 1, SECTIONS.length - 1)]?.depth ?? a;
  return Math.round(lerp(a, b, view.blend));
}

if (process.env.NODE_ENV !== "production" && SECTIONS.length !== PRESETS.length) {
  throw new Error(
    `SECTIONS (${SECTIONS.length}) and PRESETS (${PRESETS.length}) must be the same length.`
  );
}

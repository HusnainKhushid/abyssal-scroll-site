/**
 * Field presets — the whole scene, per section.
 *
 * This page has no morph targets and no shape buffers. There is one
 * cloud of seed points, and every section is a different *force field*
 * acting on it plus a different palette. Both are blended continuously
 * as you scroll, so there is no such thing as a transition state to
 * get wrong: the cloud is always exactly the field it is standing in.
 *
 * That is the opposite trade from a morph rig. A morph gives you exact
 * silhouettes and a fiddly journey between them; this gives you no
 * silhouettes at all and a journey that cannot break.
 */

export type RGB = readonly [number, number, number];

/** sRGB hex to a linear-ish triple. Values feed an additive, pre-ACES pass. */
function rgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [
    ((n >> 16) & 255) / 255,
    ((n >> 8) & 255) / 255,
    (n & 255) / 255,
  ] as const;
}

export interface FieldPreset {
  id: string;
  label: string;

  /** overall scale of the seed cloud */
  spread: number;
  /** curl-warp frequency — low is wispy, high is grainy */
  freq: number;
  /** curl-warp amplitude, world units */
  amp: number;
  /** how fast the noise field itself scrolls through the cloud */
  drift: number;
  /** downward advection; particles recycle through the band */
  fall: number;
  /** 0..1 collapse toward a filled sphere at the origin */
  pull: number;
  /** 0..1 collapse toward jittered lattice cell centres — colonies */
  cluster: number;
  /** lattice cell size for the above */
  cell: number;
  /** differential rotation about the view axis, rad/sec at r = 1 */
  swirl: number;
  /** travelling wave shear along x, driven by y */
  shear: number;

  /** point size multiplier */
  grain: number;
  /** overall radiance multiplier */
  gain: number;
  /** how much of the streamline layer shows through, 0..1 */
  stream: number;

  camZ: number;
  mouseForce: number;

  /** three-stop ramp: body, mid, highlight */
  deep: RGB;
  mid: RGB;
  hot: RGB;
}

export const PRESETS: FieldPreset[] = [
  /* I — THE DARK
     Marine snow. Particles fall through a recycling band with almost no
     lateral force, so the frame reads as a slow vertical drift. */
  {
    id: "dark",
    label: "The dark",
    spread: 1,
    freq: 0.15,
    amp: 1.5,
    drift: 0.05,
    fall: 0.62,
    pull: 0,
    cluster: 0,
    cell: 3.2,
    swirl: 0.02,
    shear: 0,
    grain: 1,
    gain: 1,
    stream: 0.18,
    camZ: 10.2,
    mouseForce: 0.5,
    deep: rgb("#05141a"),
    mid: rgb("#126b62"),
    hot: rgb("#8ff0d8"),
  },

  /* II — PRESSURE
     Half-collapsed toward a sphere, noise frequency up and amplitude
     down: the same cloud, squeezed. */
  {
    id: "pressure",
    label: "Pressure",
    spread: 0.94,
    freq: 0.26,
    amp: 0.95,
    drift: 0.09,
    fall: 0.12,
    pull: 0.58,
    cluster: 0,
    cell: 3.2,
    swirl: 0.1,
    shear: 0,
    grain: 0.86,
    gain: 1.05,
    stream: 0.3,
    camZ: 9.1,
    mouseForce: 0.34,
    deep: rgb("#05081c"),
    mid: rgb("#2b3d96"),
    hot: rgb("#9db9ff"),
  },

  /* III — LIGHT
     Cell colonies. Particles collapse toward jittered lattice centres,
     which is what turns a continuous cloud into discrete organisms. */
  {
    id: "light",
    label: "Light",
    spread: 1.08,
    freq: 0.52,
    amp: 0.42,
    drift: 0.14,
    fall: 0.06,
    pull: 0,
    cluster: 0.88,
    cell: 3.05,
    swirl: 0.26,
    shear: 0,
    grain: 1.12,
    gain: 1.15,
    stream: 0.1,
    camZ: 10.6,
    mouseForce: 0.72,
    deep: rgb("#02120f"),
    mid: rgb("#128a6a"),
    hot: rgb("#c2ffe8"),
  },

  /* IV — THE FALL
     One attractor. Everything collapses into a single dense body with
     a warm core: a whale fall, and the only warm section until the end. */
  {
    id: "fall",
    label: "The fall",
    spread: 1,
    freq: 0.34,
    amp: 0.66,
    drift: 0.1,
    fall: 0.05,
    pull: 0.92,
    cluster: 0,
    cell: 3.2,
    swirl: 0.34,
    shear: 0,
    grain: 1,
    gain: 1.2,
    stream: 0.14,
    camZ: 9.4,
    mouseForce: 0.5,
    deep: rgb("#0d0904"),
    mid: rgb("#9a6220"),
    hot: rgb("#ffdca8"),
  },

  /* V — THE MACHINES
     A travelling shear wave tears the field along x while the warp
     amplitude spikes. The only section that is deliberately unstable. */
  {
    id: "machines",
    label: "The machines",
    spread: 1.05,
    freq: 0.31,
    amp: 1.85,
    drift: 0.26,
    fall: 0.18,
    pull: 0.12,
    cluster: 0,
    cell: 3.2,
    swirl: 0.06,
    shear: 0.92,
    grain: 0.9,
    gain: 1.1,
    stream: 0.42,
    camZ: 9.8,
    mouseForce: 0.85,
    deep: rgb("#160409"),
    mid: rgb("#9c2333"),
    hot: rgb("#ff9384"),
  },

  /* VI — HOLD
     Laminar. Amplitude back down, frequency at its lowest, a gentle
     shear: the field at rest, which is the argument the page is making. */
  {
    id: "hold",
    label: "Hold",
    spread: 1.02,
    freq: 0.1,
    amp: 1.15,
    drift: 0.045,
    fall: 0.2,
    pull: 0.16,
    cluster: 0,
    cell: 3.2,
    swirl: 0.05,
    shear: 0.26,
    grain: 1.05,
    gain: 1,
    stream: 0.55,
    camZ: 10,
    mouseForce: 0.45,
    deep: rgb("#020b10"),
    mid: rgb("#166a7c"),
    hot: rgb("#9ce6ff"),
  },

  /* VII — CURRENT
     The point cloud steps back almost entirely and the streamline layer
     takes the frame. */
  {
    id: "current",
    label: "Current",
    spread: 1.15,
    freq: 0.08,
    amp: 1.4,
    drift: 0.05,
    fall: 0.1,
    pull: 0.1,
    cluster: 0,
    cell: 3.2,
    swirl: 0.03,
    shear: 0.4,
    grain: 0.8,
    gain: 0.3,
    stream: 1,
    camZ: 9.6,
    mouseForce: 0.3,
    deep: rgb("#0a0416"),
    mid: rgb("#6c2bb0"),
    hot: rgb("#ff8fd8"),
  },
];

export const SECTION_COUNT = PRESETS.length;

/** Every numeric knob, in one place, so blending is one loop. */
export const BLENDED_KEYS = [
  "spread",
  "freq",
  "amp",
  "drift",
  "fall",
  "pull",
  "cluster",
  "cell",
  "swirl",
  "shear",
  "grain",
  "gain",
  "stream",
  "camZ",
  "mouseForce",
] as const;

export type BlendedKey = (typeof BLENDED_KEYS)[number];

export type BlendedField = Record<BlendedKey, number> & {
  deep: [number, number, number];
  mid: [number, number, number];
  hot: [number, number, number];
};

export function makeBlendedField(): BlendedField {
  const out = {} as BlendedField;
  for (const k of BLENDED_KEYS) out[k] = PRESETS[0][k];
  out.deep = [...PRESETS[0].deep] as [number, number, number];
  out.mid = [...PRESETS[0].mid] as [number, number, number];
  out.hot = [...PRESETS[0].hot] as [number, number, number];
  return out;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Blends preset `a` into preset `b` by `t`, in place.
 *
 * Colour is interpolated in plain RGB on purpose. These ramps are
 * neighbours on the wheel (teal to indigo, indigo to green, crimson to
 * violet) so RGB never cuts through grey, and it avoids the hue-wrap
 * bug that makes an HSL lerp swing the long way round the wheel exactly
 * once per palette, at a different scroll position on every reload.
 */
export function blendField(
  out: BlendedField,
  a: FieldPreset,
  b: FieldPreset,
  t: number
) {
  for (const k of BLENDED_KEYS) out[k] = lerp(a[k], b[k], t);
  for (let i = 0; i < 3; i++) {
    out.deep[i] = lerp(a.deep[i], b.deep[i], t);
    out.mid[i] = lerp(a.mid[i], b.mid[i], t);
    out.hot[i] = lerp(a.hot[i], b.hot[i], t);
  }
}

/** CSS rgb() string, for the accent custom property the DOM reads. */
export function cssRGB(c: readonly number[]) {
  return `rgb(${Math.round(c[0] * 255)} ${Math.round(c[1] * 255)} ${Math.round(
    c[2] * 255
  )})`;
}

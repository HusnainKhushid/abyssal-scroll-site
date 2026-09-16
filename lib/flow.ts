import { createNoise3D, mulberry32 } from "./noise";

/**
 * Streamline generation.
 *
 * Seeds are integrated through a genuine curl-noise field on the CPU,
 * once, at load. Curl noise is divergence-free, which is the whole
 * reason the result reads as a *current* rather than as scribble: paths
 * never converge to a point or spray out of one, they braid.
 *
 * Doing it properly is affordable here precisely because it happens
 * once. The per-frame point layer uses a cheap direct warp instead —
 * curl in a vertex shader costs six noise triplets per particle, and at
 * a hundred thousand particles that is not a trade worth making.
 */

export interface Streamlines {
  /** two vertices per segment, ready for THREE.LineSegments */
  positions: Float32Array;
  /** normalised distance along the parent line, 0..1 */
  along: Float32Array;
  /** stable 0..1 per line, shared by all its vertices */
  seed: Float32Array;
  /** 0..1 tone, so lines sample different parts of the ramp */
  tone: Float32Array;
  vertexCount: number;
}

const OFF1 = 41.7;
const OFF2 = 93.1;

export function buildStreamlines(
  lines: number,
  steps: number,
  opts: {
    freq?: number;
    step?: number;
    box?: [number, number, number];
    zScale?: number;
  } = {}
): Streamlines {
  const freq = opts.freq ?? 0.115;
  const h = opts.step ?? 0.115;
  /** Seed box, full width. Paths grow well beyond it as they integrate. */
  const box = opts.box ?? [15, 6.5, 2.2];
  /**
   * Flattens the field into a slab.
   *
   * An isotropic curl field walks in z as freely as in x, and with the
   * camera at z ~ 9.6 that put a large share of the geometry behind the
   * viewer — clipped, and paying for itself in vertices either way.
   * Damping z also matches what the effect is for: a screen-parallel
   * current whose depth comes from lines crossing, not from lines
   * leaving.
   */
  const zScale = opts.zScale ?? 0.16;

  const rnd = mulberry32(0x243f6a88);
  const noise = createNoise3D(mulberry32(0xb7e15162));

  // Curl of a vector potential built from three offset noise samples.
  const E = 0.09;
  const curl = (x: number, y: number, z: number, out: [number, number, number]) => {
    // dN/dy and dN/dz for component 3 and 2, etc.
    const n1y1 = noise(x, y + E, z);
    const n1y0 = noise(x, y - E, z);
    const n1z1 = noise(x, y, z + E);
    const n1z0 = noise(x, y, z - E);

    const n2x1 = noise(x + E + OFF1, y + OFF1, z + OFF1);
    const n2x0 = noise(x - E + OFF1, y + OFF1, z + OFF1);
    const n2z1 = noise(x + OFF1, y + OFF1, z + E + OFF1);
    const n2z0 = noise(x + OFF1, y + OFF1, z - E + OFF1);

    const n3x1 = noise(x + E + OFF2, y + OFF2, z + OFF2);
    const n3x0 = noise(x - E + OFF2, y + OFF2, z + OFF2);
    const n3y1 = noise(x + OFF2, y + E + OFF2, z + OFF2);
    const n3y0 = noise(x + OFF2, y - E + OFF2, z + OFF2);

    const inv = 1 / (2 * E);
    let cx = (n3y1 - n3y0) * inv - (n2z1 - n2z0) * inv;
    let cy = (n1z1 - n1z0) * inv - (n3x1 - n3x0) * inv;
    let cz = (n2x1 - n2x0) * inv - (n1y1 - n1y0) * inv;

    const l = Math.hypot(cx, cy, cz) || 1;
    cx /= l;
    cy /= l;
    cz /= l;
    out[0] = cx;
    out[1] = cy;
    out[2] = cz;
  };

  const segsPerLine = steps - 1;
  const vertexCount = lines * segsPerLine * 2;

  const positions = new Float32Array(vertexCount * 3);
  const along = new Float32Array(vertexCount);
  const seed = new Float32Array(vertexCount);
  const tone = new Float32Array(vertexCount);

  const v: [number, number, number] = [0, 0, 0];
  const path = new Float32Array(steps * 3);

  let w = 0;

  for (let li = 0; li < lines; li++) {
    let x = (rnd() - 0.5) * box[0];
    let y = (rnd() - 0.5) * box[1];
    let z = (rnd() - 0.5) * box[2];

    for (let s = 0; s < steps; s++) {
      path[s * 3] = x;
      path[s * 3 + 1] = y;
      path[s * 3 + 2] = z;

      // Midpoint (RK2) integration. Plain Euler at this step size
      // visibly cuts corners, and the cut corners are what make a
      // streamline field look like hair instead of flow.
      curl(x * freq, y * freq, z * freq, v);
      const mx = x + v[0] * h * 0.5;
      const my = y + v[1] * h * 0.5;
      const mz = z + v[2] * h * 0.5 * zScale;

      curl(mx * freq, my * freq, mz * freq, v);
      x += v[0] * h;
      y += v[1] * h;
      z += v[2] * h * zScale;
    }

    const lineSeed = rnd();
    const lineTone = rnd();

    for (let s = 0; s < segsPerLine; s++) {
      const a = s * 3;
      const b = (s + 1) * 3;
      const t0 = s / segsPerLine;
      const t1 = (s + 1) / segsPerLine;

      positions[w * 3] = path[a];
      positions[w * 3 + 1] = path[a + 1];
      positions[w * 3 + 2] = path[a + 2];
      along[w] = t0;
      seed[w] = lineSeed;
      tone[w] = lineTone;
      w++;

      positions[w * 3] = path[b];
      positions[w * 3 + 1] = path[b + 1];
      positions[w * 3 + 2] = path[b + 2];
      along[w] = t1;
      seed[w] = lineSeed;
      tone[w] = lineTone;
      w++;
    }
  }

  return { positions, along, seed, tone, vertexCount };
}

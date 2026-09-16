/**
 * Field shaders.
 *
 * There are no morph targets here. Each particle has one fixed seed
 * position, and the section it is standing in is expressed entirely as
 * uniforms: a set of forces and a three-stop colour ramp, both blended
 * continuously between neighbouring presets by the scroll engine.
 *
 * The consequence worth stating: a section transition is not a special
 * state. There is nothing to schedule, stagger, or land — the cloud is
 * always exactly the field it is currently in.
 */

const SIMPLEX = /* glsl */ `
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 mod289(vec4 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 mm = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    mm = mm * mm;
    return 42.0 * dot(mm*mm, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

/** Shared three-stop ramp. Deep -> mid -> hot, with the knee at 0.5. */
const RAMP = /* glsl */ `
  vec3 ramp(vec3 deep, vec3 mid, vec3 hot, float t) {
    float k = clamp(t, 0.0, 1.0);
    return k < 0.5
      ? mix(deep, mid, k * 2.0)
      : mix(mid, hot, (k - 0.5) * 2.0);
  }
`;

export const fieldVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform float uIntro;
  uniform float uVelocity;

  uniform vec3  uMouse;
  uniform float uMouseForce;

  /* The section, as forces. Every one of these is a live blend of two
     neighbouring presets — none is ever a preset's own value except
     exactly at the top of a section. */
  uniform float uSpread;
  uniform float uFreq;
  uniform float uAmp;
  uniform float uDrift;
  uniform float uFall;
  uniform float uPull;
  uniform float uCluster;
  uniform float uCell;
  uniform float uSwirl;
  uniform float uShear;
  uniform float uGrain;
  uniform float uGain;

  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uHot;

  attribute vec3  aSeed;
  attribute vec3  aRand;
  attribute float aTone;
  attribute float aScale;

  varying vec3  vColor;
  varying float vAlpha;

  ${SIMPLEX}
  ${RAMP}

  vec3 hash3(vec3 c) {
    vec3 p = vec3(
      dot(c, vec3(127.1, 311.7,  74.7)),
      dot(c, vec3(269.5, 183.3, 246.1)),
      dot(c, vec3(113.5, 271.9, 124.6))
    );
    return fract(sin(p) * 43758.5453123);
  }

  vec2 rot(vec2 p, float a) {
    float c = cos(a), s = sin(a);
    return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
  }

  /** The band particles recycle through when uFall is non-zero. */
  const float BAND = 8.0;

  void main() {
    vec3 p = aSeed;

    /* --- 1. Fall, with wraparound ---------------------------------- *
       mod() over the band is an identity when uFall is zero, so this
       costs nothing in the sections that do not use it and needs no
       branch. */
    p.y = mod(p.y - uTime * uFall + BAND, BAND * 2.0) - BAND;

    p *= uSpread;

    /* --- 2. Colonies ----------------------------------------------- *
       Contract each lattice cell's contents toward a jittered centre.
       This is what turns one continuous cloud into a scatter of
       discrete bodies without needing a second set of buffers. */
    if (uCluster > 0.001) {
      vec3 cellIdx = floor(p / uCell);
      vec3 centre = (cellIdx + 0.5) * uCell + (hash3(cellIdx) - 0.5) * uCell * 0.62;
      p = mix(p, centre + (p - centre) * 0.26, uCluster);
    }

    /* --- 3. Collapse toward a filled sphere ------------------------ *
       Radius from a squared random so the body is dense in the middle
       and thins at the surface, rather than being a hollow shell. */
    if (uPull > 0.001) {
      vec3 dir = normalize(p + vec3(0.0001));
      float r = 0.45 + pow(aRand.x, 1.9) * 3.05;
      p = mix(p, dir * r, uPull);
    }

    /* --- 4. Curl warp ---------------------------------------------- *
       Two octaves of direct simplex displacement, not true curl noise.
       Curl needs six noise triplets per vertex; at this particle count
       that is the whole frame budget, and for a cloud this diffuse the
       divergence-free property is not visible. The streamline layer,
       built once on the CPU, does use real curl — that is where it
       actually reads. */
    vec3 q = p * uFreq + vec3(0.0, 0.0, uTime * uDrift);
    vec3 warp = vec3(snoise(q), snoise(q + 19.7), snoise(q + 43.3));
    vec3 q2 = q * 2.35 + 7.3;
    warp += vec3(snoise(q2), snoise(q2 + 19.7), snoise(q2 + 43.3)) * 0.42;
    p += warp * uAmp;

    /* --- 5. Differential swirl ------------------------------------- *
       Divided by radius, so the middle turns faster than the rim. A
       rigid rotation reads as a turntable. */
    if (abs(uSwirl) > 0.001) {
      float rr = length(p.xy);
      p.xy = rot(p.xy, uSwirl * uTime / (0.55 + rr * 0.4));
    }

    /* --- 6. Travelling shear --------------------------------------- */
    if (abs(uShear) > 0.001) {
      p.x += sin(p.y * 0.52 + uTime * 0.34) * uShear * 1.7;
      p.z += cos(p.y * 0.41 - uTime * 0.22) * uShear * 0.6;
    }

    /* --- 7. Cursor -------------------------------------------------- */
    vec2 toMouse = p.xy - uMouse.xy;
    float md = length(toMouse);
    float influence = smoothstep(3.0, 0.0, md);
    p.xy += normalize(toMouse + vec2(0.0001)) * influence * uMouseForce * 1.3;

    /* --- 8. Intro --------------------------------------------------- */
    p *= 1.0 + (1.0 - uIntro) * 1.8;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    /* Warp magnitude pushes a particle up its own ramp, so the parts of
       the field that are moving hardest are also the brightest. That
       coupling is what makes the colour read as *caused by* the motion
       rather than painted on top of it. */
    float energy = clamp(length(warp) * 0.42, 0.0, 1.0);
    float tone = clamp(aTone * 0.72 + energy * 0.5, 0.0, 1.0);
    vColor = ramp(uDeep, uMid, uHot, tone) * uGain;

    float sizePx = uSize * uGrain * aScale * uPixelRatio * (44.0 / max(0.001, -mv.z));
    gl_PointSize = max(sizePx, uPixelRatio * 0.9);
    // Anything inflated to reach the floor gives the difference back in
    // alpha, or the far field flattens into a uniform sheet.
    float shrink = clamp(sizePx / (uPixelRatio * 0.9), 0.35, 1.0);

    float flicker = 0.68 + 0.32 * sin(uTime * (0.9 + aRand.y * 2.2) + aRand.z * 12.566);
    float depthFade = smoothstep(-30.0, -2.0, mv.z);

    vAlpha = flicker * depthFade * shrink * uIntro * (1.0 + uVelocity * 0.35);
  }
`;

export const fieldFragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float f = 1.0 - d * 2.0;
    // Wide halo plus a tight core. One term alone gives either a blurry
    // smudge or a hard pixel; the pair reads as a glowing grain.
    float halo = pow(f, 1.8) * 0.45;
    float core = pow(f, 6.5);

    gl_FragColor = vec4(vColor * (halo + core * 1.85), (halo + core) * vAlpha);
  }
`;

/* ------------------------------------------------------------------ *
 * Streamlines
 *
 * Pre-integrated curl-noise paths, drawn as additive line segments. A
 * bright band travels each line, and because neighbouring lines carry
 * different phases the crests form the long specular edges that make a
 * flow field look lit rather than drawn.
 * ------------------------------------------------------------------ */

export const streamVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uIntro;
  uniform vec3  uDeep;
  uniform vec3  uMid;
  uniform vec3  uHot;
  uniform vec2  uParallax;

  attribute float aAlong;
  attribute float aSeed;
  attribute float aTone;

  varying vec3  vColor;
  varying float vAlpha;

  ${RAMP}

  void main() {
    vec3 p = position;
    p.xy += uParallax * (0.4 + aSeed * 0.6);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    /* A gaussian crest travelling the line. Each line runs at its own
       rate and phase, so the crests never form a marching band. */
    float speed = 0.055 + aSeed * 0.05;
    float head = fract(uTime * speed + aSeed);
    float d = abs(aAlong - head);
    d = min(d, 1.0 - d);                     // wrap at the ends
    float crest = exp(-pow(d * 11.0, 2.0));

    // Fade both ends so lines terminate in the dark rather than being
    // cut off, which is what would give the field a visible boundary.
    float ends = smoothstep(0.0, 0.12, aAlong) * smoothstep(1.0, 0.88, aAlong);

    float tone = clamp(aTone * 0.4 + crest * 0.85, 0.0, 1.0);
    vColor = ramp(uDeep, uMid, uHot, tone);

    float depthFade = smoothstep(-26.0, -2.0, mv.z);
    vAlpha = (0.05 + crest * 0.95) * ends * depthFade * uOpacity * uIntro;
  }
`;

export const streamFragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    gl_FragColor = vec4(vColor * (0.35 + vAlpha * 1.5), vAlpha);
  }
`;

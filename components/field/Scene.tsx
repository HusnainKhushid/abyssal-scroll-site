"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  Bloom,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { useEffect, useState } from "react";

import { damp, view } from "@/lib/state";
import { BACKGROUND, BLOOM_THRESHOLD } from "@/lib/theme";
import PointField from "./PointField";
import Streamers from "./Streamers";

/** Eases the pointer and decays scroll energy. One owner for both. */
function PointerRig() {
  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    view.smoothX = damp(view.smoothX, view.pointerX, 4.5, dt);
    view.smoothY = damp(view.smoothY, view.pointerY, 4.5, dt);
    view.velocity = damp(view.velocity, 0, 3.5, dt);
  });
  return null;
}

/**
 * Quality by viewport, decided once on mount. This scene is fill-rate
 * bound, so this and the DPR cap are the only levers that move much.
 */
function pickCounts(width: number, reduced: boolean) {
  if (reduced) return { points: 30000, lines: 320, steps: 60 };
  if (width < 700) return { points: 34000, lines: 380, steps: 64 };
  if (width < 1100) return { points: 66000, lines: 620, steps: 72 };
  if (width < 1700) return { points: 112000, lines: 900, steps: 80 };
  return { points: 138000, lines: 1150, steps: 88 };
}

export default function Scene() {
  const [q, setQ] = useState<ReturnType<typeof pickCounts> | null>(null);
  const [dpr, setDpr] = useState<[number, number]>([1, 1.75]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    view.reduced = reduced;
    setQ(pickCounts(window.innerWidth, reduced));
    setDpr(window.devicePixelRatio > 2 ? [1, 1.35] : [1, 1.75]);
  }, []);

  if (!q) return null;

  return (
    <Canvas
      className="webgl"
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
      camera={{ fov: 45, near: 0.1, far: 200, position: [0, 0, 10.2] }}
      // Tone mapping happens in the composer, not on the material.
      flat
    >
      <color attach="background" args={[BACKGROUND]} />

      <PointerRig />
      <Streamers lines={q.lines} steps={q.steps} />
      <PointField count={q.points} />

      {/* MSAA does nothing for additive points and costs a lot with a
          composer attached. The lines would benefit, but not enough to
          pay for it at this fill rate. */}
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={1.5}
          luminanceThreshold={BLOOM_THRESHOLD}
          luminanceSmoothing={0.45}
          mipmapBlur
          radius={0.82}
        />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.2} darkness={0.85} />
        {/* Real work: near-black gradients band badly, and this hides it. */}
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.26} />
      </EffectComposer>
    </Canvas>
  );
}

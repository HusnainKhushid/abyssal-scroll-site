"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { buildStreamlines } from "@/lib/flow";
import { damp, view } from "@/lib/state";
import { streamFragmentShader, streamVertexShader } from "./shaders";

interface Props {
  lines: number;
  steps: number;
}

/**
 * Curl-noise streamlines, drawn as additive line segments.
 *
 * Present in every section but almost invisible in most of them — the
 * `stream` knob in each preset decides how much of it shows. It comes
 * fully forward only in the closing section, where it stops being
 * texture behind the point field and becomes the subject.
 */
export default function Streamers({ lines, steps }: Props) {
  const { geometry, material } = useMemo(() => {
    const s = buildStreamlines(lines, steps);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(s.positions, 3));
    geometry.setAttribute("aAlong", new THREE.BufferAttribute(s.along, 1));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(s.seed, 1));
    geometry.setAttribute("aTone", new THREE.BufferAttribute(s.tone, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90);

    const material = new THREE.ShaderMaterial({
      vertexShader: streamVertexShader,
      fragmentShader: streamFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uIntro: { value: 0 },
        uParallax: { value: new THREE.Vector2() },
        uDeep: { value: new THREE.Color() },
        uMid: { value: new THREE.Color() },
        uHot: { value: new THREE.Color() },
      },
    });

    return { geometry, material };
  }, [lines, steps]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const u = material.uniforms;
    const f = view.field;

    u.uTime.value = state.clock.elapsedTime;
    u.uIntro.value = view.intro;

    // Damped rather than taken straight from the blend: the streamer
    // layer coming forward is the biggest single change on the page,
    // and letting it track scroll exactly makes it flicker on a
    // trackpad flick.
    u.uOpacity.value = damp(u.uOpacity.value as number, f.stream, 4, dt);

    (u.uDeep.value as THREE.Color).setRGB(f.deep[0], f.deep[1], f.deep[2]);
    (u.uMid.value as THREE.Color).setRGB(f.mid[0], f.mid[1], f.mid[2]);
    (u.uHot.value as THREE.Color).setRGB(f.hot[0], f.hot[1], f.hot[2]);

    if (!view.reduced) {
      (u.uParallax.value as THREE.Vector2).set(
        view.smoothX * 0.55,
        view.smoothY * 0.35
      );
    }
  });

  return (
    <lineSegments frustumCulled={false} geometry={geometry} renderOrder={-1}>
      <primitive object={material} attach="material" />
    </lineSegments>
  );
}

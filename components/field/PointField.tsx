"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { gaussian, mulberry32 } from "@/lib/noise";
import { clamp, damp, view } from "@/lib/state";
import { fieldFragmentShader, fieldVertexShader } from "./shaders";

interface Props {
  count: number;
}

/** Half-extents of the seed box. Must match BAND in the vertex shader. */
const BOX: [number, number, number] = [11, 8, 5];

export default function PointField({ count }: Props) {
  const { size } = useThree();

  const { geometry, material } = useMemo(() => {
    const rnd = mulberry32(0x428a2f98);

    const seed = new Float32Array(count * 3);
    const rand = new Float32Array(count * 3);
    const tone = new Float32Array(count);
    const scale = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      /* Seeds are uniform in the box, not gaussian. A gaussian cloud
         has a dense middle that survives every force in the shader and
         reads as the same blob in all seven sections; a uniform box
         lets each field decide for itself where the density goes. */
      seed[i3] = (rnd() - 0.5) * 2 * BOX[0];
      seed[i3 + 1] = (rnd() - 0.5) * 2 * BOX[1];
      seed[i3 + 2] = (rnd() - 0.5) * 2 * BOX[2];

      rand[i3] = rnd();
      rand[i3 + 1] = rnd();
      rand[i3 + 2] = rnd();

      tone[i] = rnd();
      // Mostly fine grains, a few large ones. The tail is what stops
      // the field reading as an even dust.
      scale[i] = 0.42 + Math.pow(rnd(), 3.1) * 2.2 + Math.abs(gaussian(rnd)) * 0.1;
    }

    const geometry = new THREE.BufferGeometry();
    // `position` is never read; three needs it for the draw count.
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3)
    );
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 3));
    geometry.setAttribute("aTone", new THREE.BufferAttribute(tone, 1));
    geometry.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));

    // Never cull — the field is always the subject, and it moves a long
    // way from its seed positions.
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 90);

    const material = new THREE.ShaderMaterial({
      vertexShader: fieldVertexShader,
      fragmentShader: fieldFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 1 },
        uPixelRatio: { value: 1 },
        uIntro: { value: 0 },
        uVelocity: { value: 0 },

        uMouse: { value: new THREE.Vector3(999, 999, 0) },
        uMouseForce: { value: 0 },

        uSpread: { value: 1 },
        uFreq: { value: 0.15 },
        uAmp: { value: 1.5 },
        uDrift: { value: 0.05 },
        uFall: { value: 0.6 },
        uPull: { value: 0 },
        uCluster: { value: 0 },
        uCell: { value: 3.2 },
        uSwirl: { value: 0 },
        uShear: { value: 0 },
        uGrain: { value: 1 },
        uGain: { value: 1 },

        uDeep: { value: new THREE.Color() },
        uMid: { value: new THREE.Color() },
        uHot: { value: new THREE.Color() },
      },
    });

    return { geometry, material };
  }, [count]);

  useFrame((state, rawDelta) => {
    // A tab-out otherwise arrives as one enormous step.
    const dt = Math.min(rawDelta, 1 / 30);
    const u = material.uniforms;
    const f = view.field;

    u.uTime.value = state.clock.elapsedTime;
    u.uIntro.value = view.intro;
    u.uVelocity.value = view.velocity;

    u.uSpread.value = f.spread;
    u.uFreq.value = f.freq;
    u.uAmp.value = f.amp;
    u.uDrift.value = f.drift;
    u.uFall.value = f.fall;
    u.uPull.value = f.pull;
    u.uCluster.value = f.cluster;
    u.uCell.value = f.cell;
    u.uSwirl.value = f.swirl;
    u.uShear.value = f.shear;
    u.uGrain.value = f.grain;
    u.uGain.value = f.gain;

    (u.uDeep.value as THREE.Color).setRGB(f.deep[0], f.deep[1], f.deep[2]);
    (u.uMid.value as THREE.Color).setRGB(f.mid[0], f.mid[1], f.mid[2]);
    (u.uHot.value as THREE.Color).setRGB(f.hot[0], f.hot[1], f.hot[2]);

    // Density holds on any screen if point size tracks viewport height.
    u.uSize.value = clamp(size.height / 900, 0.66, 1.5);
    u.uPixelRatio.value = Math.min(state.gl.getPixelRatio(), 2);

    const cam = state.camera as THREE.PerspectiveCamera;
    const halfH = Math.tan((cam.fov * 0.5 * Math.PI) / 180) * cam.position.z;
    const halfW = halfH * (size.width / size.height);
    (u.uMouse.value as THREE.Vector3).set(
      view.smoothX * halfW,
      view.smoothY * halfH,
      0
    );
    u.uMouseForce.value = view.reduced ? 0 : f.mouseForce;

    cam.position.z = damp(cam.position.z, f.camZ, 3, dt);
    if (!view.reduced) {
      cam.position.x = damp(cam.position.x, view.smoothX * 0.5, 3, dt);
      cam.position.y = damp(cam.position.y, view.smoothY * 0.34, 3, dt);
      cam.lookAt(0, 0, 0);
    }
  });

  return (
    <points frustumCulled={false} geometry={geometry}>
      <primitive object={material} attach="material" />
    </points>
  );
}

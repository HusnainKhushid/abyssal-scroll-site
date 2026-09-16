"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { blendField, cssRGB, PRESETS } from "@/lib/field";
import {
  applySectionScroll,
  clamp,
  contentVisibility,
  currentDepth,
  SECTION_COUNT,
  view,
} from "@/lib/state";

/**
 * Owns smooth scrolling and turns raw scroll into:
 *   - the live field blend (forces + palette) every canvas layer reads
 *   - per-panel content visibility, written straight to the DOM
 *   - the accent custom property, so the *interface* is tinted by the
 *     same ramp as the particles rather than sitting on top of it in a
 *     fixed colour
 *   - the depth readout
 *
 * Renders null. Nothing here goes through React state — this runs every
 * frame, and a re-render at that rate eats the frame budget.
 */
export default function ScrollEngine() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    view.reduced = reduced;

    const root = document.documentElement;

    let stage: HTMLElement | null = null;
    let panels: HTMLElement[] = [];
    let railFill: HTMLElement | null = null;
    let depthOut: HTMLElement | null = null;
    let sectionH = 1;
    let stageTop = 0;

    const measure = () => {
      stage = document.getElementById("stage");
      panels = Array.from(document.querySelectorAll<HTMLElement>("[data-panel]"));
      railFill = document.querySelector<HTMLElement>("[data-rail-fill]");
      depthOut = document.querySelector<HTMLElement>("[data-depth]");
      if (!stage) return;
      stageTop = stage.getBoundingClientRect().top + window.scrollY;
      sectionH = stage.offsetHeight / SECTION_COUNT;
    };

    let lastActive = -1;
    let lastDepth = -1;
    let lastAccent = "";

    const apply = (scrollY: number) => {
      if (!stage || sectionH <= 0) return;
      const raw = (scrollY - stageTop) / sectionH;
      applySectionScroll(raw);

      // The single source of truth for what the scene is doing. Written
      // once here, read by every layer — so the point field, the
      // streamers and the interface can never disagree about the
      // section they are in.
      const a = PRESETS[view.index];
      const b = PRESETS[Math.min(view.index + 1, PRESETS.length - 1)];
      blendField(view.field, a, b, view.blend);

      if (view.index !== lastActive) {
        lastActive = view.index;
        document.dispatchEvent(
          new CustomEvent("abyssal:section", { detail: lastActive })
        );
      }

      // Only touch the custom property when the rounded colour actually
      // changes; a style write per frame invalidates the whole subtree.
      const accent = cssRGB(view.field.hot);
      if (accent !== lastAccent) {
        lastAccent = accent;
        root.style.setProperty("--accent", accent);
      }

      for (let i = 0; i < panels.length; i++) {
        const local = clamp(raw - i, 0, 1);
        // A panel is live only once its own section starts. Without this
        // guard every not-yet-reached panel sits at local = 0, which the
        // visibility curve reads as fully visible, and they all paint
        // over the current one.
        const inPlay = raw >= i - 0.001 && raw < i + 1;
        const vis = inPlay ? contentVisibility(local) : 0;

        const el = panels[i];
        el.style.opacity = vis.toFixed(3);
        el.style.transform = `translate3d(0, ${((1 - vis) * 22).toFixed(2)}px, 0)`;
        el.style.visibility = vis < 0.004 ? "hidden" : "visible";
      }

      if (railFill) {
        railFill.style.transform = `scaleX(${view.progress.toFixed(4)})`;
      }

      const depth = currentDepth();
      if (depthOut && depth !== lastDepth) {
        lastDepth = depth;
        depthOut.textContent = depth.toLocaleString("en-GB");
      }
    };

    measure();
    apply(window.scrollY);

    // Pointer feed for the scene. Lives here rather than in the custom
    // cursor, so it works whether or not the cursor is mounted.
    const onPointer = (e: PointerEvent) => {
      view.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      view.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let lenis: Lenis | null = null;
    let rafId = 0;

    const onGoto = (e: Event) => {
      const index = clamp((e as CustomEvent<number>).detail, 0, SECTION_COUNT - 1);
      const to = stageTop + index * sectionH + sectionH * 0.05;
      if (lenis) lenis.scrollTo(to, { duration: 1.5 });
      else window.scrollTo({ top: to });
    };
    document.addEventListener("abyssal:goto", onGoto);

    const onReady = () => {
      measure();
      apply(window.scrollY);
      document.dispatchEvent(
        new CustomEvent("abyssal:section", { detail: view.index })
      );
    };
    document.addEventListener("abyssal:ready", onReady);

    /* Reduced motion is a genuinely separate path — no Lenis, a passive
       native listener — written out in full rather than branched inside
       the main one, where it would break silently. */
    if (reduced) {
      const onScroll = () => apply(window.scrollY);
      const onResize = () => {
        measure();
        apply(window.scrollY);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onResize);
      document.fonts?.ready.then(onResize).catch(() => {});
      return () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("abyssal:goto", onGoto);
        document.removeEventListener("abyssal:ready", onReady);
      };
    }

    lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3.2),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      syncTouch: false,
    });

    // Lenis's own event is the only place apply() is called; also
    // listening to window scroll would double-drive it.
    lenis.on("scroll", (e: { scroll: number; velocity: number }) => {
      apply(e.scroll);
      view.velocity = clamp(Math.abs(e.velocity) / 45, 0, 1);
    });

    const raf = (time: number) => {
      lenis?.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const onResize = () => {
      measure();
      lenis?.resize();
      apply(window.scrollY);
    };
    window.addEventListener("resize", onResize);
    // Late fonts change section offsets and silently desync the field
    // blend from the pin.
    document.fonts?.ready.then(onResize).catch(() => {});

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("abyssal:goto", onGoto);
      document.removeEventListener("abyssal:ready", onReady);
      lenis?.destroy();
    };
  }, []);

  return null;
}

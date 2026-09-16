"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

import { MOTTO, WORDMARK } from "@/lib/content";
import { PRESETS } from "@/lib/field";
import { view } from "@/lib/state";

/**
 * Holds the frame while the streamline field is integrated, then hands
 * off to the intro tween.
 *
 * The handoff overlaps deliberately: the curtain starts lifting while
 * the field is still contracting inward, so loading and the first
 * movement are one motion rather than a spinner followed by a scene.
 */
export default function Preloader() {
  const root = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      view.intro = 1;
      view.ready = true;
      document.documentElement.style.removeProperty("overflow");
      document.dispatchEvent(new CustomEvent("abyssal:ready"));
      setMounted(false);
    };

    if (reduced) {
      finish();
      return;
    }

    document.documentElement.style.overflow = "hidden";

    const counter = { n: 0 };
    const intro = { v: 0 };
    let lastLabel = -1;

    const tl = gsap.timeline();

    tl.to(counter, {
      n: 6000,
      duration: 2,
      ease: "power2.inOut",
      onUpdate() {
        const v = Math.round(counter.n);
        if (num.current) num.current.textContent = v.toLocaleString("en-GB");
        if (bar.current) bar.current.style.transform = `scaleX(${v / 6000})`;

        const idx = Math.min(
          PRESETS.length - 1,
          Math.floor((v / 6000) * PRESETS.length)
        );
        if (idx !== lastLabel && label.current) {
          lastLabel = idx;
          label.current.textContent = PRESETS[idx].label.toUpperCase();
        }
      },
    })
      .to(
        root.current,
        { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "expo.inOut" },
        "+=0.15"
      )
      .to(
        intro,
        {
          v: 1,
          duration: 2,
          ease: "power2.out",
          onUpdate() {
            view.intro = intro.v;
          },
        },
        "<0.05"
      )
      .add(() => {
        view.ready = true;
        document.documentElement.style.removeProperty("overflow");
        document.dispatchEvent(new CustomEvent("abyssal:ready"));
      }, "<0.45")
      .add(() => setMounted(false));

    return () => {
      tl.kill();
      document.documentElement.style.removeProperty("overflow");
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      ref={root}
      className="preloader"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="pre-row">
        <span className="wordmark">{WORDMARK}</span>
        <span className="motto">{MOTTO}</span>
      </div>

      <div className="pre-mid">
        {/* Counts metres, not percent — the readout the page uses
            everywhere else, so the loader is already teaching it. */}
        <span className="pre-depth num" ref={num}>
          0
        </span>
        <span className="pre-unit">M</span>
      </div>

      <div className="pre-row">
        <span className="mono" ref={label}>
          THE DARK
        </span>
        <span className="mono">DESCENDING</span>
      </div>

      <div className="pre-bar">
        <i ref={bar} />
      </div>
    </div>
  );
}

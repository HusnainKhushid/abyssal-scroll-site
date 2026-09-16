"use client";

import { useEffect, useRef } from "react";

import { clamp, view } from "@/lib/state";

interface Props {
  lines: string[];
  index: number;
}

/**
 * The closing beat. The point field steps back, the streamline layer
 * takes the frame, and one short line at a time is scrubbed through by
 * scroll position.
 *
 * Each line owns a window of the section's local progress and fades in
 * and out inside it, so the reader controls the pace of the last three
 * sentences instead of watching them on a timer.
 */
export default function Closer({ lines, index }: Props) {
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el || lines.length === 0) return;

    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-line]"));
    const n = nodes.length;
    // Windows overlap slightly so one line is always resolving.
    const span = 1 / n;

    const paint = (local: number) => {
      for (let i = 0; i < n; i++) {
        const centre = span * (i + 0.5);
        const d = Math.abs(local - centre) / (span * 0.85);
        const o = clamp(1 - d, 0, 1);
        // Eased, so the middle of each window is a clean hold rather
        // than a constant crossfade.
        const eased = o * o * (3 - 2 * o);
        nodes[i].style.opacity = eased.toFixed(3);
        nodes[i].style.transform = `translate3d(0, ${((1 - eased) * 10).toFixed(2)}px, 0)`;
      }
    };

    if (view.reduced) {
      // No scrub: show them all, stacked and legible.
      nodes.forEach((node) => {
        node.style.opacity = "1";
        node.style.position = "static";
        node.style.transform = "none";
      });
      return;
    }

    let raf = 0;
    let active = false;

    const tick = () => {
      paint(view.index === index ? view.local : view.index > index ? 1 : 0);
      if (active) raf = requestAnimationFrame(tick);
    };

    const onSection = (e: Event) => {
      const next = (e as CustomEvent<number>).detail === index;
      if (next === active) return;
      active = next;
      cancelAnimationFrame(raf);
      if (active) raf = requestAnimationFrame(tick);
      else paint(view.index > index ? 1 : 0);
    };

    paint(0);
    document.addEventListener("abyssal:section", onSection);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("abyssal:section", onSection);
    };
  }, [index, lines.length]);

  return (
    <div className="closer" ref={wrap}>
      <div className="closer-stack">
        {lines.map((line) => (
          <p className="closer-line" data-line key={line}>
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

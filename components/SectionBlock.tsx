"use client";

import gsap from "gsap";
import { useEffect, useRef } from "react";

import type { SectionContent } from "@/lib/content";
import { view } from "@/lib/state";
import Closer from "./ui/Closer";

interface Props {
  section: SectionContent;
  index: number;
}

/**
 * Display type is split to the *line*, and each line is clipped by its
 * own mask. That works here — and not on a flowed paragraph — because
 * these headlines are set, not wrapped: every break is authored in the
 * content file, so a line can never reflow out from under its mask.
 */
function Title({ lines }: { lines: string[] }) {
  return (
    <h2 className="display">
      {lines.map((line, i) => (
        <span className="line" key={i}>
          <span className="line-in">{line}</span>
        </span>
      ))}
    </h2>
  );
}

export default function SectionBlock({ section, index }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  /* Driven by the scroll engine's active-section event, so the reveal
     fires exactly as the copy appears. An IntersectionObserver fires
     roughly a screen early on sections this tall and the animation
     would be over before anyone saw it. */
  useEffect(() => {
    const el = panel.current;
    if (!el) return;

    const lines = el.querySelectorAll<HTMLElement>(".line-in");
    const fades = el.querySelectorAll<HTMLElement>("[data-fade]");

    if (view.reduced) {
      gsap.set(lines, { yPercent: 0, opacity: 1 });
      gsap.set(fades, { opacity: 1, y: 0 });
      return;
    }

    // Both directions kill first, or scrubbing back and forth stacks
    // tweens until the copy stops responding at all.
    const reset = () => {
      gsap.killTweensOf(lines);
      gsap.killTweensOf(fades);
      gsap.set(lines, { yPercent: 108, opacity: 1 });
      gsap.set(fades, { opacity: 0, y: 12 });
    };

    const play = () => {
      gsap.killTweensOf(lines);
      gsap.killTweensOf(fades);
      gsap.to(lines, {
        yPercent: 0,
        duration: 1.05,
        ease: "expo.out",
        stagger: 0.075,
      });
      gsap.to(fades, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.22,
      });
    };

    const onSection = (e: Event) => {
      if ((e as CustomEvent<number>).detail === index) play();
      else reset();
    };

    reset();
    document.addEventListener("abyssal:section", onSection);
    return () => {
      gsap.killTweensOf(lines);
      gsap.killTweensOf(fades);
      document.removeEventListener("abyssal:section", onSection);
    };
  }, [index]);

  const label = (
    <span className="sec-label" data-fade>
      <b>( {section.numeral} )</b>
      <i />
      {section.code} — {section.name.toUpperCase()}
    </span>
  );

  return (
    <section className="stage-section" id={section.id} data-section={`${String(index + 1).padStart(2, "0")}-${section.id}`} aria-label={section.name}>
      <div className="stage-pin">
        <div className={`panel layout-${section.layout}`} data-panel ref={panel}>
          {section.layout === "closer" ? (
            <Closer lines={section.lines ?? []} index={index} />
          ) : (
            <>
              <div className="head">
                <Title lines={section.title} />
                {section.stat ? (
                  <span className="stat" data-fade>
                    {section.stat}
                  </span>
                ) : null}
              </div>

              <aside className="note">
                {label}
                <p data-fade>{section.note}</p>
                {section.cta ? (
                  <a className="link" href="#top" data-fade data-interactive
                     onClick={(e) => e.preventDefault()}>
                    {section.cta}
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                    </svg>
                  </a>
                ) : null}
              </aside>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";

import { MOTTO, SECTIONS, WORDMARK } from "@/lib/content";
import { goto } from "@/lib/nav";

/**
 * Fixed interface: wordmark, section index, depth readout, progress.
 *
 * The reference this grew out of has a static list in the corner with
 * no active state and no progress — on a seven-beat page you cannot
 * tell where you are or skip. Every item here is a real control, the
 * active one is marked, and the whole thing is tinted by the same
 * `--accent` the scroll engine derives from the field's own palette.
 */
export default function Chrome() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onSection = (e: Event) => setActive((e as CustomEvent<number>).detail);
    document.addEventListener("abyssal:section", onSection);
    return () => document.removeEventListener("abyssal:section", onSection);
  }, []);

  return (
    <>
      <header className="chrome chrome-tl" data-section="00-chrome">
        <button
          type="button"
          className="wordmark"
          onClick={() => goto(0)}
          data-interactive
        >
          {WORDMARK}
        </button>
        <span className="motto">{MOTTO}</span>

        {/* Depth doubles as the progress readout: the one number on the
            page that is both thematic and functional. It lives in the
            top-left stack rather than a corner of its own, because the
            other three corners are all claimed by section content. */}
        <span className="depth" aria-hidden="true">
          <b className="num" data-depth>
            0
          </b>
          <i>M</i>
        </span>
        <span className="depth-label" aria-hidden="true">
          Depth
        </span>
      </header>

      <nav className="chrome chrome-tr" aria-label="Sections">
        {SECTIONS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="nav-item"
            data-active={active === i}
            aria-current={active === i ? "true" : undefined}
            onClick={() => goto(i)}
            data-interactive
          >
            {s.name.toUpperCase()}
            <svg viewBox="0 0 12 12" aria-hidden="true">
              <path
                d="M3.5 8.5 8.5 3.5M4.5 3.5h4v4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          </button>
        ))}
      </nav>

      <div className="rail" aria-hidden="true">
        <span className="rail-track">
          <i className="rail-fill" data-rail-fill />
        </span>
      </div>
    </>
  );
}

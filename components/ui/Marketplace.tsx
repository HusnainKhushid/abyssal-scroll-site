"use client";

import { useEffect } from "react";

/* Marketplace iframe hook — same contract as every scroll site.
   Posts the section list on mount, the section under the viewport centre as
   it changes, and accepts { type: 'scrollTo', id } from the parent. */
export default function Marketplace() {
  useEffect(() => {
    if (window.parent === window) return;
    const post = (payload: Record<string, unknown>) =>
      window.parent.postMessage({ source: "scroll-site", ...payload }, "*");

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    post({ type: "sections", ids: els.map((el) => el.dataset.section) });

    let current: string | undefined;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.section;
          if (id === current) continue;
          current = id;
          post({ type: "section", id });
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));

    const onMessage = (e: MessageEvent) => {
      if (e.data?.type !== "scrollTo") return;
      document
        .querySelector(`[data-section="${e.data.id}"]`)
        ?.scrollIntoView({ behavior: "smooth" });
    };
    window.addEventListener("message", onMessage);
    return () => {
      io.disconnect();
      window.removeEventListener("message", onMessage);
    };
  }, []);
  return null;
}

"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { SECTIONS } from "@/lib/content";
import ScrollEngine from "./ScrollEngine";
import SectionBlock from "./SectionBlock";
import Chrome from "./ui/Chrome";
import Cursor from "./ui/Cursor";
import Footer from "./ui/Footer";
import Marketplace from "./ui/Marketplace";
import Preloader from "./ui/Preloader";

// ssr: false is mandatory — the canvas touches window on import.
const Scene = dynamic(() => import("./field/Scene"), { ssr: false });

export default function Experience() {
  const [showScene, setShowScene] = useState(false);

  // Deferred one tick past the preloader. Integrating a thousand
  // streamlines is a few hundred milliseconds of synchronous work, and
  // without this it blocks the preloader's first paint.
  useEffect(() => {
    const id = window.setTimeout(() => setShowScene(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <a className="skip-link" href="#stage">
        Skip to content
      </a>

      <Preloader />
      <Cursor />

      <div className="canvas-layer" aria-hidden="true">
        {showScene && <Scene />}
      </div>

      <Chrome />

      <main id="top">
        <div id="stage">
          {SECTIONS.map((section, i) => (
            <SectionBlock key={section.id} section={section} index={i} />
          ))}
        </div>

        <Footer />
      </main>

      <ScrollEngine />
      <Marketplace />
    </>
  );
}

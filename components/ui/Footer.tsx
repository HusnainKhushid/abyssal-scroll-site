"use client";

import { BRAND, FOOTER_COLUMNS, MOTTO, WORDMARK } from "@/lib/content";
import { goto } from "@/lib/nav";

export default function Footer() {
  return (
    <footer className="footer" id="footer" data-section="99-footer">
      <div className="footer-top">
        <div className="footer-brand">
          <span className="wordmark">{WORDMARK}</span>
          <p>
            An open survey of the deep seabed, and the case for leaving it
            alone until we know what is there.
          </p>
          <span className="motto">{MOTTO}</span>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <div className="footer-col" key={col.title}>
            <span className="mono">{col.title.toUpperCase()}</span>
            {col.links.map((link) => (
              <a
                key={link}
                href="#top"
                onClick={(e) => e.preventDefault()}
                data-interactive
              >
                {link}
              </a>
            ))}
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span className="mono">
          © {new Date().getFullYear()} {BRAND.toUpperCase()} — CC BY-SA 4.0
        </span>
        <span className="mono">DATA: GEBCO / ISA / OBIS</span>
        <button
          type="button"
          className="mono"
          onClick={() => goto(0)}
          data-interactive
        >
          SURFACE ↑
        </button>
      </div>
    </footer>
  );
}

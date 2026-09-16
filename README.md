# Abyssal — Leave it dark

Seven pinned sections descending through the deep sea over a WebGL streamline particle field. Next.js 15 static export. Built for the Scroll Sites marketplace, iframe-ready.

- `npm run dev` / `npm run build` (→ `out/`; `BASE_PATH=/repo-name` for GitHub Pages)

## Live URLs
- **Primary (Vercel):** https://abyssal-scroll-site.vercel.app — this is the URL the marketplace embeds in its iframe.
- Mirror (GitHub Pages): https://husnainkhushid.github.io/abyssal-scroll-site/

Both deploy automatically on push to `main`.

## For the coding agent
Section resources live in the marketplace workspace under `02-sections/abyssal/`. Section ids: `00-chrome 01-dark 02-pressure 03-light 04-fall 05-machines 06-hold 07-current 99-footer`. iframe bridge: posts `{ source:'scroll-site', type:'sections'|'section' }`, accepts `{ type:'scrollTo', id }`.

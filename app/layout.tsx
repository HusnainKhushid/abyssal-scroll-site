import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { BRAND } from "@/lib/content";
import { ACCENT_FALLBACK, BACKGROUND } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND} — Leave it dark`,
  description:
    "An open survey of the deep seabed, and the case for a moratorium on deep-sea mining until the science is in.",
};

export const viewport: Viewport = {
  themeColor: BACKGROUND,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      style={{ ["--accent" as string]: ACCENT_FALLBACK }}
    >
      <body>{children}</body>
    </html>
  );
}

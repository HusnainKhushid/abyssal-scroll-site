import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // static export so one source serves Vercel and GitHub Pages;
  // BASE_PATH is set by the Pages workflow to "/<repo>"
  output: "export",
  basePath: process.env.BASE_PATH || "",
  images: { unoptimized: true },
  // Several sibling projects share this parent directory; pin the trace
  // root so Next stops inferring the home folder from a stray lockfile.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;

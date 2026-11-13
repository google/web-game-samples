import { defineConfig } from "vite";

/**
 * The Content-Security-Policy YouTube serves a Playable with, from the SDK
 * Test Suite guide. The dev and preview servers send it too, so anything it
 * would block on YouTube fails here first, in the browser's console.
 * https://developers.google.com/youtube/gaming/playables/reference/test_suite_guide
 */
const YOUTUBE_CSP = [
  "default-src 'none'",
  "script-src 'report-sample' 'self' 'unsafe-eval' 'unsafe-inline' blob: https://www.youtube.com/game_api/v0 https://www.youtube.com/game_api/v0/ https://www.youtube.com/game_api/v1 https://www.youtube.com/game_api/v1/",
  "object-src 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
  "connect-src 'self' blob: data:",
  "sandbox allow-pointer-lock allow-same-origin allow-scripts",
  "base-uri 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
].join("; ");

export default defineConfig({
  // relative paths, so the build runs from wherever YouTube serves it
  base: "./",
  server: {
    port: 8080,
    headers: { "Content-Security-Policy": YOUTUBE_CSP },
  },
  preview: {
    port: 8080,
    headers: { "Content-Security-Policy": YOUTUBE_CSP },
  },
});

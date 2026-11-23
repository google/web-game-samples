import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    target: "esnext",
    sourcemap: true,
  },
  server: {
    host: true,
    port: 3000,
  },
  preview: {
    host: true,
    port: 8080,
  },
});

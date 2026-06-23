import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React + Vite config for the stock-charts demo (Angular migration).
// Output mirrors the Angular build target (dist/app) so existing deploy
// config (Cloudflare Pages / `_headers`) continues to work unchanged.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/app",
    sourcemap: true
  },
  server: {
    port: 4200,
    open: true
  }
});

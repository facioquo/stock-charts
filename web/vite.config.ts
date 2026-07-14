import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// React + Vite config for the stock-charts demo (Angular migration).
// Output mirrors the Angular build target (dist/app) so existing deploy
// config (Cloudflare Pages / `_headers`) continues to work unchanged.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/app",
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom")) {
              return "vendor-react";
            }
            if (
              id.includes("@facioquo/indy-charts") ||
              id.includes("chart.js") ||
              id.includes("chartjs")
            ) {
              return "vendor-charting";
            }
            return "vendor";
          }
        }
      }
    }
  },
  server: {
    port: 4200,
    open: true
  }
});

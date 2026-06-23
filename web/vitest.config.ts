import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Vitest config mirrors vite.config aliases per tech-stack rule 7.
// jsdom environment + @testing-library/react for component/unit tests.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.spec.{ts,tsx}", "src/main.tsx", "src/test-setup.ts"]
    }
  }
});

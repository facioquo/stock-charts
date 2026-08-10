import { defineConfig } from "vitest/config";

// The unit tests here cover pure logic (CORS resolution, quote mapping) and run
// in plain Node. Container and binding behaviour is exercised end-to-end with
// `wrangler dev` — see server/edge/README.md.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"]
  }
});

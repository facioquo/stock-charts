import { describe, it, expect } from "vitest";
import config from "./eslint.config.ts";

describe("eslint.config", () => {
  it("exports a valid non-empty flat config array", () => {
    expect(Array.isArray(config)).toBe(true);
    expect((config as unknown[]).length).toBeGreaterThan(0);
  });

  it("includes an ignores block for dist and node_modules", () => {
    type ConfigBlock = { ignores?: string[]; files?: string[] };
    const ignoresBlock = (config as ConfigBlock[]).find(c => "ignores" in c && !("files" in c));
    expect(ignoresBlock?.ignores).toContain("dist/**");
    expect(ignoresBlock?.ignores).toContain("node_modules/**");
  });

  it("includes a TypeScript files configuration block", () => {
    type ConfigBlock = { files?: string[] };
    const tsBlock = (config as ConfigBlock[]).find(c => c.files?.includes("**/*.ts"));
    expect(tsBlock).toBeDefined();
  });

  it("includes a spec files configuration block", () => {
    type ConfigBlock = { files?: string[] };
    const specBlock = (config as ConfigBlock[]).find(c => c.files?.includes("**/*.spec.ts"));
    expect(specBlock).toBeDefined();
  });
});

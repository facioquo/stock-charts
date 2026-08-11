import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { applyCors, preflightResponse, resolveAllowedOrigin, stripCors } from "./cors";

const ALLOW_LIST =
  "https://charts.stockindicators.dev,https://stock-charts-vitepress.pages.dev,https://*.preview.pages.dev";

/**
 * The list the Worker actually deploys with. Read straight out of
 * wrangler.jsonc: JSON.parse would choke on the comments, and the value is a
 * single flat string, so a targeted match is enough. A rename or restructure
 * throws here, which is the intent.
 */
function deployedAllowList(): string {
  // Path built as a string: this package compiles against Workers types, where
  // the global URL is not Node's and so is not a valid readFileSync argument.
  const configPath = join(dirname(fileURLToPath(import.meta.url)), "..", "wrangler.jsonc");
  const config = readFileSync(configPath, "utf8");
  const match = /"ALLOWED_ORIGINS":\s*"([^"]+)"/.exec(config);

  if (match === null) {
    throw new Error("ALLOWED_ORIGINS not found in wrangler.jsonc");
  }

  return match[1];
}

describe("resolveAllowedOrigin", () => {
  it("echoes an exactly listed origin", () => {
    expect(resolveAllowedOrigin("https://charts.stockindicators.dev", ALLOW_LIST)).toBe(
      "https://charts.stockindicators.dev"
    );
  });

  it("rejects an unlisted origin", () => {
    expect(resolveAllowedOrigin("https://evil.example", ALLOW_LIST)).toBeNull();
  });

  it("rejects a scheme mismatch on a listed host", () => {
    expect(resolveAllowedOrigin("http://charts.stockindicators.dev", ALLOW_LIST)).toBeNull();
  });

  it("matches subdomains for wildcard entries", () => {
    expect(resolveAllowedOrigin("https://abc123.preview.pages.dev", ALLOW_LIST)).toBe(
      "https://abc123.preview.pages.dev"
    );
  });

  it("does not let a wildcard entry match an unrelated suffix", () => {
    expect(resolveAllowedOrigin("https://notpreview.pages.dev", ALLOW_LIST)).toBeNull();
  });

  it("returns null when the request carries no Origin", () => {
    expect(resolveAllowedOrigin(null, ALLOW_LIST)).toBeNull();
  });

  it("returns null for a malformed Origin instead of throwing", () => {
    expect(resolveAllowedOrigin("not-a-url", ALLOW_LIST)).toBeNull();
  });
});

// The cases above use a synthetic list to exercise the matcher. These run the
// matcher against the list the Worker actually ships, so an edit to that
// comma-separated string cannot silently drop coverage for a live site.
describe("deployed ALLOWED_ORIGINS", () => {
  const deployed = deployedAllowList();

  it.each([
    ["production docs", "https://dotnet.stockindicators.dev"],
    ["production demo", "https://charts.stockindicators.dev"],
    ["docs Pages default domain", "https://stock-indicators-dotnet-76p.pages.dev"],
    ["demo Pages default domain", "https://stock-charts.pages.dev"],
    // Preview hostnames are generated per branch and per deployment, so these
    // stand in for an ever-changing set the list can only match by suffix.
    ["docs preview by branch", "https://some-branch.stock-indicators-dotnet-76p.pages.dev"],
    ["docs preview by hash", "https://a1b2c3d4.stock-indicators-dotnet-76p.pages.dev"],
    ["demo preview", "https://some-branch.stock-charts.pages.dev"],
    ["vitepress demo preview", "https://some-branch.stock-charts-vitepress.pages.dev"]
  ])("allows the %s origin", (_label, origin) => {
    expect(resolveAllowedOrigin(origin, deployed)).toBe(origin);
  });

  it.each([
    ["an unrelated Pages site", "https://evil.pages.dev"],
    ["a suffix-spoofing host", "https://stock-indicators-dotnet-76p.pages.dev.evil.example"],
    ["a prefix-spoofing host", "https://notstock-indicators-dotnet-76p.pages.dev"],
    ["a scheme downgrade", "http://some-branch.stock-indicators-dotnet-76p.pages.dev"]
  ])("rejects %s", (_label, origin) => {
    expect(resolveAllowedOrigin(origin, deployed)).toBeNull();
  });

  it("stays scoped to known projects rather than all of pages.dev", () => {
    expect(deployed).not.toContain("https://*.pages.dev,");
    expect(deployed.endsWith("https://*.pages.dev")).toBe(false);
  });
});

describe("preflightResponse", () => {
  it("answers 204 with the allowed methods for a permitted origin", () => {
    const response = preflightResponse("https://charts.stockindicators.dev");

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://charts.stockindicators.dev"
    );
    expect(response.headers.get("access-control-allow-methods")).toContain("GET");
  });

  it("omits allow headers for a rejected origin", () => {
    const response = preflightResponse(null);

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
    expect(response.headers.get("access-control-allow-methods")).toBeNull();
  });
});

describe("cache-safe CORS handling", () => {
  it("strips every CORS header so a cached entry is origin-agnostic", () => {
    const headers = new Headers({
      "access-control-allow-origin": "https://charts.stockindicators.dev",
      "access-control-allow-credentials": "true",
      vary: "Origin",
      "cache-control": "public, max-age=900"
    });

    stripCors(headers);

    expect(headers.get("access-control-allow-origin")).toBeNull();
    expect(headers.get("access-control-allow-credentials")).toBeNull();
    expect(headers.get("vary")).toBeNull();
    // The caching directive itself must survive.
    expect(headers.get("cache-control")).toBe("public, max-age=900");
  });

  it("re-attaches the requesting origin, so one entry serves several sites", () => {
    const stored = new Headers({ "cache-control": "public, max-age=900" });

    const first = new Headers(stored);
    applyCors(first, "https://charts.stockindicators.dev");

    const second = new Headers(stored);
    applyCors(second, "https://stock-charts-vitepress.pages.dev");

    expect(first.get("access-control-allow-origin")).toBe("https://charts.stockindicators.dev");
    expect(second.get("access-control-allow-origin")).toBe(
      "https://stock-charts-vitepress.pages.dev"
    );
    expect(first.get("vary")).toBe("Origin");
  });

  it("never advertises credentialed CORS — the API is fully anonymous", () => {
    // Regression guard: credentialed CORS gains nothing for a cookie-less,
    // auth-less API and would widen what a compromised allowed origin could
    // attempt against it.
    const headers = new Headers();
    applyCors(headers, "https://charts.stockindicators.dev");

    expect(headers.get("access-control-allow-origin")).toBe("https://charts.stockindicators.dev");
    expect(headers.get("access-control-allow-credentials")).toBeNull();
  });
});

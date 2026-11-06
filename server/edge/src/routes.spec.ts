import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { isApiRoute } from "./routes";

const webApiPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../WebApi");
const endpointsPath = resolve(webApiPath, "Endpoints.cs");
const batchEndpointsPath = resolve(webApiPath, "Endpoints.Batch.cs");

describe("isApiRoute", () => {
  it.each([
    "/",
    "/quotes",
    "/QUOTES",
    "/indicators",
    "/indicators/",
    "/indicators/batch",
    "/indicators/%62atch"
  ])("accepts the fixed route %s", path => {
    expect(isApiRoute(path)).toBe(true);
  });

  it.each(["/EMA", "/EMA/", "/ATR-STOP-CLOSE", "/HL2", "/ZIGZAG-HIGHLOW/"])(
    "accepts the indicator route %s",
    path => {
      expect(isApiRoute(path)).toBe(true);
    }
  );

  it.each([
    "/wp",
    "/wp-login.php",
    "/wordpress/",
    "/blog/",
    "/.env",
    "/.git/config",
    "/robots.txt",
    "/favicon.ico",
    "/EMA/extra",
    "/EMA-",
    "/-EMA",
    "/ema",
    "/%E0%A4%A"
  ])("refuses %s", path => {
    expect(isApiRoute(path)).toBe(false);
  });

  it("accepts every route the API controller declares", () => {
    // The controller is the source of truth for what the API serves; any route
    // this check refused would 404 at the edge without reaching it.
    const source = readFileSync(endpointsPath, "utf8") + readFileSync(batchEndpointsPath, "utf8");
    const named = [...source.matchAll(/\[HttpGet\("([^"]*)"\)\]/g)].map(match => `/${match[1]}`);
    const routes = source.includes("[HttpGet]") ? ["/", ...named] : named;

    expect(routes.length).toBeGreaterThan(50);
    expect(routes.filter(route => !isApiRoute(route))).toEqual([]);
  });
});

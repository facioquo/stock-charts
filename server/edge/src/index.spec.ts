import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Env } from "./env";

const { fetchMock, getContainerMock } = vi.hoisted(() => {
  const fetchMock = vi.fn();
  const getContainerMock = vi.fn(() => ({ fetch: fetchMock }));
  return { fetchMock, getContainerMock };
});

// index.ts imports container.ts, which extends the real Container class — itself
// dependent on the Workers-only `cloudflare:workers` module. Stubbing both named
// exports lets the worker's fetch handler load and run under plain Node so this
// file can mock the container hop instead of needing a real container or
// `wrangler dev`.
vi.mock("@cloudflare/containers", () => ({
  Container: class {},
  getContainer: getContainerMock
}));

const worker = (await import("./index")).default;

const ALLOWED_ORIGIN = "https://charts.stockindicators.dev";

function makeEnv(): Env {
  return {
    API: {},
    QUOTES: {},
    ALLOWED_ORIGINS: ALLOWED_ORIGIN,
    QUOTE_SYMBOLS: "SPY,QQQ",
    QUOTE_HISTORY_DAYS: "800"
  } as unknown as Env;
}

function makeCtx(): ExecutionContext {
  return { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as unknown as ExecutionContext;
}

describe("worker.fetch", () => {
  let cacheMatch: ReturnType<typeof vi.fn>;
  let cachePut: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    cacheMatch = vi.fn().mockResolvedValue(undefined);
    cachePut = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("caches", { default: { match: cacheMatch, put: cachePut } });
    fetchMock.mockReset();
    getContainerMock.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("answers an OPTIONS preflight without touching the cache or the container", async () => {
    const request = new Request("https://api.example/quotes", {
      method: "OPTIONS",
      headers: { Origin: ALLOWED_ORIGIN }
    });

    const response = await worker.fetch(request, makeEnv(), makeCtx());

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    expect(cacheMatch).not.toHaveBeenCalled();
    expect(getContainerMock).not.toHaveBeenCalled();
  });

  it("rejects methods other than GET/HEAD/OPTIONS", async () => {
    const request = new Request("https://api.example/quotes", { method: "POST" });

    const response = await worker.fetch(request, makeEnv(), makeCtx());

    expect(response.status).toBe(405);
    expect(getContainerMock).not.toHaveBeenCalled();
  });

  it("serves a cache hit with CORS re-applied and the HIT status", async () => {
    cacheMatch.mockResolvedValue(
      new Response("cached body", {
        status: 200,
        headers: { "cache-control": "public, max-age=60" }
      })
    );

    const request = new Request("https://api.example/quotes", {
      headers: { Origin: ALLOWED_ORIGIN }
    });

    const response = await worker.fetch(request, makeEnv(), makeCtx());

    expect(response.headers.get("x-edge-cache")).toBe("HIT");
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    expect(await response.text()).toBe("cached body");
    expect(getContainerMock).not.toHaveBeenCalled();
  });

  it("omits the body on a HEAD cache hit", async () => {
    cacheMatch.mockResolvedValue(
      new Response("cached body", {
        status: 200,
        headers: { "cache-control": "public, max-age=60" }
      })
    );

    const request = new Request("https://api.example/quotes", { method: "HEAD" });

    const response = await worker.fetch(request, makeEnv(), makeCtx());

    expect(response.headers.get("x-edge-cache")).toBe("HIT");
    expect(await response.text()).toBe("");
  });

  it("forwards a cache miss to the container and stores a cacheable response", async () => {
    fetchMock.mockResolvedValue(
      new Response("fresh body", {
        status: 200,
        headers: { "cache-control": "public, max-age=60" }
      })
    );

    const ctx = makeCtx();
    const request = new Request("https://api.example/quotes", {
      headers: { Origin: ALLOWED_ORIGIN }
    });

    const response = await worker.fetch(request, makeEnv(), ctx);

    expect(getContainerMock).toHaveBeenCalledTimes(1);
    expect(response.headers.get("x-edge-cache")).toBe("MISS");
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
    expect(await response.text()).toBe("fresh body");
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1);
    expect(cachePut).toHaveBeenCalledTimes(1);
  });

  it("does not cache a HEAD response even when the API marks it cacheable", async () => {
    fetchMock.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "cache-control": "public, max-age=60" }
      })
    );

    const ctx = makeCtx();
    const request = new Request("https://api.example/quotes", { method: "HEAD" });

    await worker.fetch(request, makeEnv(), ctx);

    expect(ctx.waitUntil).not.toHaveBeenCalled();
    expect(cachePut).not.toHaveBeenCalled();
  });

  it("does not cache a non-cacheable upstream response", async () => {
    fetchMock.mockResolvedValue(new Response("not cacheable", { status: 200 }));

    const ctx = makeCtx();
    const request = new Request("https://api.example/quotes");

    await worker.fetch(request, makeEnv(), ctx);

    expect(ctx.waitUntil).not.toHaveBeenCalled();
    expect(cachePut).not.toHaveBeenCalled();
  });

  it("returns a 502 with CORS headers when the container fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("container unreachable"));

    const request = new Request("https://api.example/quotes", {
      headers: { Origin: ALLOWED_ORIGIN }
    });

    const response = await worker.fetch(request, makeEnv(), makeCtx());

    expect(response.status).toBe(502);
    expect(response.headers.get("access-control-allow-origin")).toBe(ALLOWED_ORIGIN);
  });
});

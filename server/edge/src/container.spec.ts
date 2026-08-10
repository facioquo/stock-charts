import { describe, expect, it, vi } from "vitest";

// container.ts extends the real Container class, which imports `cloudflare:workers` —
// a virtual module only resolvable inside the Workers runtime. A minimal stand-in lets
// this module load under plain Node so `outboundByHost` (an ordinary async function, no
// container or DO instance involved) can be unit tested without `wrangler dev`.
vi.mock("@cloudflare/containers", () => ({
  Container: class {}
}));

const { ApiContainer, QUOTES_HOST } = await import("./container");

// Matches OutboundHandlerContext's required shape; `params` stays unset since this
// handler does not declare any.
const outboundContext = { containerId: "test-container", className: "ApiContainer" };

describe("ApiContainer.outboundByHost", () => {
  const handlers = ApiContainer.outboundByHost ?? {};

  // Read via Object.entries (rather than a computed `handlers[QUOTES_HOST]`
  // lookup) and confirm the single registered host is the expected one.
  const [registeredHost, handler] = Object.entries(handlers)[0] ?? [];

  if (registeredHost !== QUOTES_HOST || handler === undefined) {
    throw new Error(`No outbound handler registered for ${QUOTES_HOST}`);
  }

  it("derives the R2 key from the request path, stripping the leading slash", async () => {
    const get = vi.fn().mockResolvedValue(null);
    const env = { QUOTES: { get } };

    await handler(new Request(`http://${QUOTES_HOST}/QQQ-DAILY.json`), env, outboundContext);

    expect(get).toHaveBeenCalledWith("QQQ-DAILY.json");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("returns a 404 when the dataset has not been published", async () => {
    const get = vi.fn().mockResolvedValue(null);
    const env = { QUOTES: { get } };

    const response = await handler(
      new Request(`http://${QUOTES_HOST}/SPY-DAILY.json`),
      env,
      outboundContext
    );

    expect(response.status).toBe(404);
  });

  it("returns the R2 object body as JSON when published", async () => {
    const get = vi.fn().mockResolvedValue({ body: "[]" });
    const env = { QUOTES: { get } };

    const response = await handler(
      new Request(`http://${QUOTES_HOST}/QQQ-DAILY.json`),
      env,
      outboundContext
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(await response.text()).toBe("[]");
  });
});

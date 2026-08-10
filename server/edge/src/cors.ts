/**
 * CORS is owned by the Worker rather than the container for two reasons:
 * preflight never has to wake the container, and cached responses can stay
 * origin-agnostic (see the caching notes in ./index.ts).
 */

const CORS_RESPONSE_HEADERS = [
  "access-control-allow-origin",
  "access-control-allow-credentials",
  "access-control-allow-methods",
  "access-control-allow-headers",
  "access-control-max-age"
];

/** Parses the comma-separated `ALLOWED_ORIGINS` var. */
export function parseAllowList(allowedOrigins: string): string[] {
  return allowedOrigins
    .split(",")
    .map(entry => entry.trim())
    .filter(entry => entry.length > 0);
}

/**
 * Returns the origin to echo back, or `null` when the request has no `Origin`
 * or the origin is not allowed. Entries may use a leading `*.` wildcard to
 * match subdomains, e.g. `https://*.pages.dev` matches preview deployments —
 * mirroring `SetIsOriginAllowedToAllowWildcardSubdomains()` in the .NET policy.
 */
export function resolveAllowedOrigin(
  requestOrigin: string | null,
  allowedOrigins: string
): string | null {
  if (requestOrigin === null || requestOrigin.length === 0) {
    return null;
  }

  let origin: URL;

  try {
    origin = new URL(requestOrigin);
  } catch {
    // A malformed Origin is never allowed, and must not throw out of the
    // request pipeline.
    return null;
  }

  const matches = parseAllowList(allowedOrigins).some(entry => {
    if (!entry.includes("*.")) {
      return entry === requestOrigin;
    }

    const [scheme, host] = entry.split("://");

    if (scheme === undefined || host === undefined) {
      return false;
    }

    const suffix = host.replace("*.", "");

    return (
      origin.protocol === `${scheme}:` &&
      origin.hostname !== suffix &&
      origin.hostname.endsWith(`.${suffix}`)
    );
  });

  return matches ? requestOrigin : null;
}

/** Answers a preflight request without touching the container. */
export function preflightResponse(allowedOrigin: string | null): Response {
  const response = new Response(null, { status: 204 });
  applyCors(response.headers, allowedOrigin);

  if (allowedOrigin !== null) {
    response.headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
    response.headers.set("access-control-allow-headers", "content-type, accept");
    response.headers.set("access-control-max-age", "86400");
  }

  return response;
}

/**
 * Removes every CORS and `Vary` header so the response can be stored once and
 * replayed to any allowed origin. Without this, a shared cache keyed only by URL
 * would hand one origin's `Access-Control-Allow-Origin` to another and fail the
 * browser check (facioquo/stock-charts#517).
 */
export function stripCors(headers: Headers): void {
  for (const header of CORS_RESPONSE_HEADERS) {
    headers.delete(header);
  }
  headers.delete("vary");
}

/** Writes the per-request CORS headers onto an outgoing response. */
export function applyCors(headers: Headers, allowedOrigin: string | null): void {
  // Always advertise the vary so intermediaries do not treat these responses as
  // origin-independent, even though this Worker's own cache entries are.
  headers.set("vary", "Origin");

  if (allowedOrigin === null) {
    return;
  }

  headers.set("access-control-allow-origin", allowedOrigin);
  headers.set("access-control-allow-credentials", "true");
}

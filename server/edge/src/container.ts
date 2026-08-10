import { Container } from "@cloudflare/containers";
import type { DurableObject } from "cloudflare:workers";

import type { Env } from "./env";

/** Hostname the container fetches quote datasets from. */
export const QUOTES_HOST = "quotes.r2";

/**
 * The .NET indicator API, running as a Cloudflare Container.
 *
 * Requests arrive only through the Worker in {@link ./index.ts}, which serves
 * cached responses without waking this instance. Instances sleep after
 * {@link sleepAfter} of inactivity, and billing stops while asleep.
 */
export class ApiContainer extends Container<Env> {
  defaultPort = 8080;
  sleepAfter = "10m";

  /**
   * The API needs no general internet access: its only outbound dependency is
   * the quote dataset, which {@link outboundByHost} serves from R2 inside the
   * Workers runtime. Keeping this off avoids egress charges and shrinks the
   * container's reachable surface.
   *
   * Troubleshooting: if `/quotes` serves the 2018 backup dataset after a deploy
   * even though R2 holds current data, this is the first thing to check. The
   * API treats an unreachable quote host as "not published yet" and fails over
   * silently by design, so a blocked outbound request looks like empty storage.
   */
  enableInternet = false;

  constructor(ctx: DurableObject["ctx"], env: Env) {
    super(ctx, env);

    // Set here rather than as a field initializer because the values depend on
    // `env`, which is only available once the base constructor has run.
    this.envVars = {
      ASPNETCORE_ENVIRONMENT: "Production",
      ASPNETCORE_URLS: `http://+:${this.defaultPort}`,
      // ASP.NET Core binds `__` to configuration section separators.
      Quotes__BaseUrl: `http://${QUOTES_HOST}/`,
      Api__PublicBaseUrl: env.PUBLIC_BASE_URL ?? ""
    };
  }
}

/**
 * Translates the container's plain HTTP GET of `http://quotes.r2/QQQ-DAILY.json`
 * into an R2 binding call. This is how the container reads storage without ever
 * holding credentials — the handler runs in the Workers runtime, not the
 * container sandbox.
 */
ApiContainer.outboundByHost = {
  [QUOTES_HOST]: async (request: Request, env: Env): Promise<Response> => {
    const key = new URL(request.url).pathname.replace(/^\//, "");
    const object = await env.QUOTES.get(key);

    if (object === null) {
      return new Response(null, { status: 404 });
    }

    return new Response(object.body, {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
};

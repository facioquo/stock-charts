/**
 * Paths the Worker answers itself or forwards to the API container.
 *
 * Anything else is refused at the edge, so vulnerability scanners and stray
 * crawlers probing paths like `/wp-login.php` or `/.env` never wake the
 * billable container.
 */

/** The API's fixed routes, matched without regard to case as ASP.NET does. */
const FIXED_ROUTES = new Set(["", "quotes", "indicators", "indicators/batch"]);

/**
 * Indicator routes: the catalog's uppercase ids, such as `EMA` or
 * `ATR-STOP-CLOSE`. Matched by shape rather than by list so a new indicator
 * needs no change here; scanner paths are lowercase and fail it.
 */
const INDICATOR_ROUTE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;

/**
 * True when `pathname` names a route the API serves. A trailing slash is
 * allowed, and the path is percent-decoded first because ASP.NET decodes it
 * before routing.
 */
export function isApiRoute(pathname: string): boolean {
  let decoded: string;

  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }

  const route = decoded.replace(/^\/|\/$/g, "");
  return FIXED_ROUTES.has(route.toLowerCase()) || INDICATOR_ROUTE.test(route);
}

/**
 * Keeps crawlers off the API host. The API serves data for charts, not pages,
 * and every crawler fetch that misses the cache would wake the container.
 */
export const ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

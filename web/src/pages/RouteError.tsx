import { useRouteError } from "react-router-dom";
import { Button } from "@primer/react";

/*
 * Browser messages for a dynamic import whose chunk no longer exists: Chromium,
 * Firefox, and Safari. After a deploy the old hashed chunk names fall through to
 * the SPA's index.html, so a tab opened before it fails its next lazy route.
 */
const STALE_CHUNK_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|not a valid JavaScript MIME type/i;

export function isStaleChunkError(error: unknown): boolean {
  return error instanceof Error && STALE_CHUNK_PATTERN.test(error.message);
}

/**
 * Route `errorElement`: replaces React Router's default error screen with a
 * reload, which fetches the current index.html and its chunk names.
 */
export function RouteError(): React.JSX.Element {
  const error = useRouteError();
  const isStale = isStaleChunkError(error);

  return (
    <div className="container" role="alert">
      <h1>{isStale ? "This demo was updated." : "Something went wrong."}</h1>
      <h2>
        {isStale
          ? "A newer version went live while this tab was open."
          : "This page failed to load."}
      </h2>
      <Button
        variant="primary"
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload page
      </Button>
    </div>
  );
}

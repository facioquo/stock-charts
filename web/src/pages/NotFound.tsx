import { useEffect } from "react";

import { pushMetaTags } from "../services/meta";

/** Ports `PageNotFoundComponent` — 404 view with noindex meta tags. */
export function NotFound(): React.JSX.Element {
  useEffect(() => {
    const description = "This is not a page.  Try again.";
    pushMetaTags([
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Page not found" },
      { name: "description", content: description },
      { property: "og:description", content: description }
    ]);
  }, []);

  return (
    <div className="container">
      <h1>Your strategy was unprofitable.</h1>
      <h2>Page not found</h2>

      <p>
        <a href="/">Return to our homepage</a>
      </p>
      <p>
        <small>
          or{" "}
          <a href="https://forms.gle/AgZq5zR2qX1Eq3xn8" target="_blank" rel="noopener noreferrer">
            contact us
          </a>{" "}
          if you need help
        </small>
      </p>
    </div>
  );
}

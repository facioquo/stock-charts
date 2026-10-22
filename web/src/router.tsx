import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";

import { App } from "./components/App";
import { RouteError } from "./pages/RouteError";

const LazyChartPage = lazy(() =>
  import("./pages/ChartPage").then(module => ({ default: module.ChartPage }))
);
const LazyNotFound = lazy(() =>
  import("./pages/NotFound").then(module => ({ default: module.NotFound }))
);

function RouteSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="route-loading" />}>{children}</Suspense>;
}

/**
 * Routes:
 *   ""        -> ChartPage
 *   "settings"-> redirects to "/" (the settings dialog opens from ChartPage)
 *   "*"       -> NotFound
 *
 * RouteError is bundled eagerly so it still renders when a lazy chunk is gone.
 * The pathless child keeps the header on screen; the root entry covers App.
 */
export const routes: RouteObject[] = [
  {
    path: "/",
    element: <App />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          {
            index: true,
            element: (
              <RouteSuspense>
                <LazyChartPage />
              </RouteSuspense>
            )
          },
          { path: "settings", element: <Navigate to="/" replace /> },
          {
            path: "*",
            element: (
              <RouteSuspense>
                <LazyNotFound />
              </RouteSuspense>
            )
          }
        ]
      }
    ]
  }
];

export const router = createBrowserRouter(routes);

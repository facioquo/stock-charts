import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

import { App } from "./components/App";

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
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
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
]);

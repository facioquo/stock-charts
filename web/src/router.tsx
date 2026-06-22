import { createBrowserRouter, Navigate } from "react-router-dom";

import { App } from "./components/App";
import { ChartPage } from "./pages/ChartPage";
import { NotFound } from "./pages/NotFound";

/**
 * Routes mirror the Angular `app.routes.ts`:
 *   ""        -> ChartPage
 *   "settings"-> picker (lands in the stacked follow-up slice; redirects to "/" for now)
 *   "*"       -> NotFound
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <ChartPage /> },
      { path: "settings", element: <Navigate to="/" replace /> },
      { path: "*", element: <NotFound /> }
    ]
  }
]);

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { setupIndyCharts } from "@facioquo/indy-charts";

import { router } from "./router";
import { loadSettings } from "./services/userPrefs";
import "./styles/styles.scss";

// Register financial chart types + indicator chart setup once at startup.
setupIndyCharts();

// Apply persisted user preferences (theme/tooltips) before the first render so
// the lazily-constructed ChartController captures the saved theme — otherwise the
// chart legend labels initialize with the default (dark) palette on reload.
loadSettings();

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

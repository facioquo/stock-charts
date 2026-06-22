import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { setupIndyCharts } from "@facioquo/indy-charts";

import { router } from "./router";
import "./styles/styles.css";

// Register financial chart types + indicator chart setup once at startup.
setupIndyCharts();

const container = document.getElementById("root");
if (!container) throw new Error("Root container #root not found");

createRoot(container).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);

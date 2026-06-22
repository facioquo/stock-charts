import { useEffect } from "react";
import { Outlet } from "react-router-dom";

import { loadSettings } from "../services/userPrefs";

/**
 * Root shell — header toolbar + routed outlet. Ports `AppComponent`, applying
 * saved user preferences (theme) on mount.
 */
export function App(): React.JSX.Element {
  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <>
      <header>
        <div className="main-toolbar noselect">
          <div>
            <h1 className="no-wrap">
              <a href="https://dotnet.stockindicators.dev" target="_blank" rel="noopener">
                stock indicators <small>for .NET</small>
              </a>
            </h1>
            <h2 className="no-wrap">
              <a
                href="https://github.com/facioquo/stock-charts"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>demo site</strong>
              </a>
            </h2>
          </div>
        </div>
      </header>

      <main id="main-content">
        <Outlet />
      </main>
    </>
  );
}

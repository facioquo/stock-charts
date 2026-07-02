import { Outlet } from "react-router-dom";

/**
 * Root shell — header toolbar + routed outlet. Ports `AppComponent`. Saved user
 * preferences (theme/tooltips) are applied in `main.tsx` before the first render
 * so the chart controller captures the persisted theme at construction.
 */
export function App(): React.JSX.Element {
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

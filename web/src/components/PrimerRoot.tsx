import { useSyncExternalStore, type ReactNode } from "react";
import { BaseStyles, ThemeProvider } from "@primer/react";

import { getSettings, subscribeToTheme } from "../services/userPrefs";

/**
 * Primer's theme for every control, set once at the app root. Its color mode
 * follows the site's dark theme switch rather than the OS, so controls and the
 * site-themed page always agree.
 */
export function PrimerRoot({ children }: { children: ReactNode }): React.JSX.Element {
  const isDarkTheme = useSyncExternalStore(subscribeToTheme, () => getSettings().isDarkTheme);
  return (
    <ThemeProvider colorMode={isDarkTheme ? "night" : "day"}>
      <BaseStyles>{children}</BaseStyles>
    </ThemeProvider>
  );
}

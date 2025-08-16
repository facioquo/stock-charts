import { Injectable } from "@angular/core";

/**
 * Media Query Service for abstracting media query functionality
 * Part of issue #414 - Hardening Chart Testing Strategy
 * Provides testable media query abstraction
 */
@Injectable({
  providedIn: "root"
})
export class MediaQueryService {
  /**
   * Check if a media query matches
   */
  matches(query: string): boolean {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia(query).matches;
    }
    return false; // Default for SSR
  }

  /**
   * Listen for media query changes
   */
  listen(query: string, callback: (matches: boolean) => void): () => void {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia(query);
      const handler = (event: MediaQueryListEvent) => callback(event.matches);

      // Initial call
      callback(mediaQuery.matches);

      // Listen for changes
      mediaQuery.addEventListener("change", handler);

      // Return cleanup function
      return () => mediaQuery.removeEventListener("change", handler);
    }

    return () => {}; // No-op cleanup for SSR
  }

  /**
   * Common media query checks
   */
  isMobile(): boolean {
    return this.matches("(max-width: 768px)");
  }

  isTablet(): boolean {
    return this.matches("(min-width: 769px) and (max-width: 1024px)");
  }

  isDesktop(): boolean {
    return this.matches("(min-width: 1025px)");
  }

  isDarkMode(): boolean {
    return this.matches("(prefers-color-scheme: dark)");
  }

  prefersReducedMotion(): boolean {
    return this.matches("(prefers-reduced-motion: reduce)");
  }
}

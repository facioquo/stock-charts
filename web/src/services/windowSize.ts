/**
 * Port of the Angular `WindowService` resize/bar-count logic.
 * `subscribeResize` debounces and de-duplicates resize events (150ms);
 * `calculateOptimalBars` keeps the ~5px-per-bar heuristic (min 20, max 500).
 */
const DEBOUNCE_MS = 150;

export function getWindowSize(): { width: number; height: number } {
  if (typeof window !== "undefined") {
    return { width: window.innerWidth, height: window.innerHeight };
  }
  return { width: 1024, height: 768 };
}

export function calculateOptimalBars(containerWidth?: number): number {
  // Nullish coalescing so an explicit 0 width is respected.
  const width = containerWidth ?? getWindowSize().width;
  const pixelsPerBar = 5;
  const minBars = 20;
  const maxBars = 500;

  const calculatedBars = Math.floor(width / pixelsPerBar);
  return Math.max(minBars, Math.min(maxBars, calculatedBars));
}

/** Subscribe to debounced, de-duplicated window resize events. Returns an unsubscribe fn. */
export function subscribeResize(
  handler: (dimensions: { width: number; height: number }) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = { width: -1, height: -1 };

  const onResize = (): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      const next = { width: window.innerWidth, height: window.innerHeight };
      if (next.width === last.width && next.height === last.height) return;
      last = next;
      handler(next);
    }, DEBOUNCE_MS);
  };

  window.addEventListener("resize", onResize);
  return () => {
    if (timer) clearTimeout(timer);
    window.removeEventListener("resize", onResize);
  };
}

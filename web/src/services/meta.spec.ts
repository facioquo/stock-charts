import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { guid, pushMetaTags, scrollToEnd, scrollToStart, titleWithSuffix } from "./meta";

/**
 * Vitest parity port of the Angular `UtilityService` spec
 * (`client/src/app/services/utility.service.spec.ts`). The Angular service
 * delegated to the `@angular/platform-browser` `Meta`/`Title` services; the
 * React port manipulates `document.head` / `document.title` directly, so the
 * meta-tag assertions read the real DOM instead of mocked Angular services.
 */
describe("meta", () => {
  describe("titleWithSuffix", () => {
    it("concatenates the base title with the suffix", () => {
      expect(titleWithSuffix("My Page", "Stock Indicators")).toBe("My Page | Stock Indicators");
    });

    it("returns the default suffix only when the base title is empty", () => {
      expect(titleWithSuffix("")).toBe("Stock Indicators for .NET (demo)");
    });

    it("uses a custom suffix when provided", () => {
      expect(titleWithSuffix("Chart", "Custom Suffix")).toBe("Chart | Custom Suffix");
    });

    it("treats a single-space base title as non-empty", () => {
      expect(titleWithSuffix(" ", "Suffix")).toBe("  | Suffix");
    });
  });

  describe("guid", () => {
    it("generates a GUID with the default prefix", () => {
      expect(guid()).toMatch(/^chart[0-9a-f-]{36}$/i);
    });

    it("generates a GUID with a custom prefix", () => {
      expect(guid("custom")).toMatch(/^custom[0-9a-f-]{36}$/i);
    });

    it("generates unique GUIDs", () => {
      expect(guid()).not.toBe(guid());
    });

    it("handles an empty prefix", () => {
      expect(guid("")).toMatch(/^[0-9a-f-]{36}$/i);
    });
  });

  describe("pushMetaTags", () => {
    let originalHead: string;
    let originalTitle: string;

    beforeEach(() => {
      originalHead = document.head.innerHTML;
      originalTitle = document.title;
    });

    afterEach(() => {
      document.head.innerHTML = originalHead;
      document.title = originalTitle;
    });

    it("adds a new meta tag when none exists", () => {
      pushMetaTags([{ name: "description", content: "Test description" }]);

      const tag = document.head.querySelector<HTMLMetaElement>("meta[name='description']");
      expect(tag).not.toBeNull();
      expect(tag?.getAttribute("content")).toBe("Test description");
    });

    it("updates an existing meta tag instead of duplicating it", () => {
      pushMetaTags([{ name: "description", content: "Old" }]);
      pushMetaTags([{ name: "description", content: "New description" }]);

      const tags = document.head.querySelectorAll("meta[name='description']");
      expect(tags).toHaveLength(1);
      expect(tags[0].getAttribute("content")).toBe("New description");
    });

    it("sets the document title for an og:title tag with content", () => {
      pushMetaTags([{ property: "og:title", content: "Page Title" }]);

      expect(document.title).toBe("Page Title");
    });

    it("does not set the title when og:title has no content", () => {
      document.title = "Original";

      pushMetaTags([{ property: "og:title", content: "" }]);

      expect(document.title).toBe("Original");
    });

    it("applies multiple meta tags", () => {
      pushMetaTags([
        { name: "description", content: "Test" },
        { name: "keywords", content: "test, keywords" }
      ]);

      expect(document.head.querySelector("meta[name='description']")).not.toBeNull();
      expect(document.head.querySelector("meta[name='keywords']")).not.toBeNull();
    });

    it("prefers the id selector over property and name", () => {
      pushMetaTags([{ id: "custom-tag", property: "og:x", name: "y", content: "by-id" }]);

      const tag = document.head.querySelector<HTMLMetaElement>("meta[id='custom-tag']");
      expect(tag).not.toBeNull();
      expect(tag?.getAttribute("content")).toBe("by-id");
    });

    it("ignores a tag with no identifying attribute", () => {
      const before = document.head.querySelectorAll("meta").length;

      pushMetaTags([{ content: "orphan" }]);

      expect(document.head.querySelectorAll("meta").length).toBe(before);
    });
  });

  describe("scrollToStart / scrollToEnd", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("scrolls the target element to its start after the delay", () => {
      vi.useFakeTimers();
      const element = document.createElement("div");
      element.id = "scroll-target";
      const scrollIntoView = vi.fn();
      element.scrollIntoView = scrollIntoView;
      document.body.appendChild(element);

      scrollToStart("scroll-target", 0);
      vi.runAllTimers();

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "start",
        inline: "start"
      });

      element.remove();
    });

    it("scrolls the target element to its end after the delay", () => {
      vi.useFakeTimers();
      const element = document.createElement("div");
      element.id = "scroll-target-end";
      const scrollIntoView = vi.fn();
      element.scrollIntoView = scrollIntoView;
      document.body.appendChild(element);

      scrollToEnd("scroll-target-end", 0);
      vi.runAllTimers();

      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "end",
        inline: "end"
      });

      element.remove();
    });

    it("does nothing when the target element is missing", () => {
      vi.useFakeTimers();

      scrollToStart("does-not-exist", 0);

      expect(() => vi.runAllTimers()).not.toThrow();
    });
  });
});

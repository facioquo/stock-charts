import { TestBed } from "@angular/core/testing";
import { Meta, MetaDefinition, Title } from "@angular/platform-browser";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import type { Mock } from "vitest";
import { UtilityService } from "./utility.service";

describe("UtilityService", () => {
  let service: UtilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UtilityService]
    });

    service = TestBed.inject(UtilityService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("titleWithSuffix", () => {
    it("should concatenate base title with suffix", () => {
      const result = service.titleWithSuffix("My Page", "Stock Indicators");
      expect(result).toBe("My Page | Stock Indicators");
    });

    it("should return suffix only when base title is empty", () => {
      const result = service.titleWithSuffix("");
      expect(result).toBe("Stock Indicators for .NET (demo)");
    });

    it("should use custom suffix when provided", () => {
      const result = service.titleWithSuffix("Chart", "Custom Suffix");
      expect(result).toBe("Chart | Custom Suffix");
    });

    it("should handle single space base title", () => {
      const result = service.titleWithSuffix(" ", "Suffix");
      expect(result).toBe("  | Suffix");
    });
  });

  describe("guid", () => {
    it("should generate a GUID with default prefix", () => {
      const result = service.guid();
      expect(result).toMatch(/^chart[0-9a-f-]{36}$/i);
    });

    it("should generate a GUID with custom prefix", () => {
      const result = service.guid("custom");
      expect(result).toMatch(/^custom[0-9a-f-]{36}$/i);
    });

    it("should generate unique GUIDs", () => {
      const guid1 = service.guid();
      const guid2 = service.guid();
      expect(guid1).not.toBe(guid2);
    });

    it("should handle empty prefix", () => {
      const result = service.guid("");
      expect(result).toMatch(/^[0-9a-f-]{36}$/i);
    });
  });

  describe("pushMetaTags", () => {
    let metaMock: any;
    let titleMock: any;

    beforeEach(() => {
      metaMock = {
        getTag: vi.fn(),
        addTag: vi.fn(),
        updateTag: vi.fn()
      };

      titleMock = {
        setTitle: vi.fn()
      };

      // Inject mocks
      (service as any).meta = metaMock;
      (service as any).title = titleMock;
    });

    it("should add new meta tag when it does not exist", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { name: "description", content: "Test description" };
      service.pushMetaTags([tag]);

      expect(metaMock.addTag).toHaveBeenCalledWith(tag);
      expect(metaMock.updateTag).not.toHaveBeenCalled();
    });

    it("should update existing meta tag", () => {
      metaMock.getTag.mockReturnValue({ name: "description", content: "Old" });

      const tag: MetaDefinition = { name: "description", content: "New description" };
      service.pushMetaTags([tag]);

      expect(metaMock.updateTag).toHaveBeenCalledWith(tag, "name='description'");
      expect(metaMock.addTag).not.toHaveBeenCalled();
    });

    it("should set page title when og:title is provided", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { property: "og:title", content: "Page Title" };
      service.pushMetaTags([tag]);

      expect(titleMock.setTitle).toHaveBeenCalledWith("Page Title");
    });

    it("should not set title when og:title has no content", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { property: "og:title", content: "" };
      service.pushMetaTags([tag]);

      expect(titleMock.setTitle).not.toHaveBeenCalled();
    });

    it("should handle multiple meta tags", () => {
      metaMock.getTag.mockReturnValue(null);

      const tags: MetaDefinition[] = [
        { name: "description", content: "Test" },
        { name: "keywords", content: "test, keywords" }
      ];
      service.pushMetaTags(tags);

      expect(metaMock.addTag).toHaveBeenCalledTimes(2);
    });

    it("should use id attribute when present", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { id: "custom-tag", content: "Test" };
      service.pushMetaTags([tag]);

      expect(metaMock.getTag).toHaveBeenCalledWith("id='custom-tag'");
    });

    it("should use property attribute when id is not present", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { property: "og:description", content: "Test" };
      service.pushMetaTags([tag]);

      expect(metaMock.getTag).toHaveBeenCalledWith("property='og:description'");
    });

    it("should use name attribute when neither id nor property is present", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { name: "viewport", content: "width=device-width" };
      service.pushMetaTags([tag]);

      expect(metaMock.getTag).toHaveBeenCalledWith("name='viewport'");
    });

    it("should handle UNDEFINED attribute when no identifying attribute is present", () => {
      metaMock.getTag.mockReturnValue(null);

      const tag: MetaDefinition = { content: "Test" };
      service.pushMetaTags([tag]);

      expect(metaMock.getTag).toHaveBeenCalledWith("UNDEFINED");
    });

    it("should handle empty tags array", () => {
      service.pushMetaTags([]);

      expect(metaMock.addTag).not.toHaveBeenCalled();
    });
  });

  describe("scrollToStart", () => {
    let getElementByIdSpy: Mock;
    let scrollIntoViewSpy: Mock;

    beforeEach(() => {
      scrollIntoViewSpy = vi.fn();
      getElementByIdSpy = vi.spyOn(document, "getElementById");
      getElementByIdSpy.mockReturnValue({
        scrollIntoView: scrollIntoViewSpy
      } as unknown as HTMLElement);
    });

    it("should scroll element into view at start with default offset", async () => {
      service.scrollToStart("test-id");

      await vi.waitFor(
        () => {
          expect(getElementByIdSpy).toHaveBeenCalledWith("test-id");
          expect(scrollIntoViewSpy).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "start",
            inline: "start"
          });
        },
        { timeout: 300 }
      );
    });

    it("should scroll element into view with custom offset", async () => {
      service.scrollToStart("test-id", 100);

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it("should not scroll if element does not exist", async () => {
      getElementByIdSpy.mockReturnValue(null);

      service.scrollToStart("non-existent-id");

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).not.toHaveBeenCalled();
        },
        { timeout: 300 }
      );
    });

    it("should handle zero offset", async () => {
      service.scrollToStart("test-id", 0);

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).toHaveBeenCalled();
        },
        { timeout: 150 }
      );
    });
  });

  describe("scrollToEnd", () => {
    let getElementByIdSpy: Mock;
    let scrollIntoViewSpy: Mock;

    beforeEach(() => {
      scrollIntoViewSpy = vi.fn();
      getElementByIdSpy = vi.spyOn(document, "getElementById");
      getElementByIdSpy.mockReturnValue({
        scrollIntoView: scrollIntoViewSpy
      } as unknown as HTMLElement);
    });

    it("should scroll element into view at end with default offset", async () => {
      service.scrollToEnd("test-id");

      await vi.waitFor(
        () => {
          expect(getElementByIdSpy).toHaveBeenCalledWith("test-id");
          expect(scrollIntoViewSpy).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "end",
            inline: "end"
          });
        },
        { timeout: 300 }
      );
    });

    it("should scroll element into view with custom offset", async () => {
      service.scrollToEnd("test-id", 100);

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });

    it("should not scroll if element does not exist", async () => {
      getElementByIdSpy.mockReturnValue(null);

      service.scrollToEnd("non-existent-id");

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).not.toHaveBeenCalled();
        },
        { timeout: 300 }
      );
    });

    it("should use end positioning for scrolling", async () => {
      service.scrollToEnd("test-id");

      await vi.waitFor(
        () => {
          expect(scrollIntoViewSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              block: "end",
              inline: "end"
            })
          );
        },
        { timeout: 300 }
      );
    });
  });
});

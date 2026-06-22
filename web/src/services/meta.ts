import { v4 as uuid } from "uuid";

/**
 * Port of the meta/title/scroll helpers from the Angular `UtilityService`.
 * Updates document `<title>` and `<meta>` tags directly (no framework Meta service).
 */
export interface MetaTag {
  name?: string;
  property?: string;
  id?: string;
  content?: string;
}

export function pushMetaTags(tags: MetaTag[]): void {
  if (typeof document === "undefined") return;

  tags.forEach(tag => {
    if (tag.property === "og:title" && tag.content) {
      document.title = tag.content;
    }

    const selector =
      tag.id !== undefined
        ? `meta[id='${tag.id}']`
        : tag.property !== undefined
          ? `meta[property='${tag.property}']`
          : tag.name !== undefined
            ? `meta[name='${tag.name}']`
            : undefined;
    if (!selector) return;

    let element = document.head.querySelector<HTMLMetaElement>(selector);
    if (!element) {
      element = document.createElement("meta");
      if (tag.id) element.setAttribute("id", tag.id);
      if (tag.property) element.setAttribute("property", tag.property);
      if (tag.name) element.setAttribute("name", tag.name);
      document.head.appendChild(element);
    }
    if (tag.content !== undefined) element.setAttribute("content", tag.content);
  });
}

export function titleWithSuffix(
  baseTitle: string,
  suffix = "Stock Indicators for .NET (demo)"
): string {
  return baseTitle.length > 0 ? `${baseTitle} | ${suffix}` : suffix;
}

export function guid(prefix = "chart"): string {
  return `${prefix}${uuid()}`;
}

export function scrollToStart(id: string, offset = 200): void {
  setTimeout(() => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start", inline: "start" });
  }, offset);
}

export function scrollToEnd(id: string, offset = 200): void {
  setTimeout(() => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "end", inline: "end" });
  }, offset);
}

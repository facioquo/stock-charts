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

function metaSelector(tag: MetaTag): string | undefined {
  if (tag.id !== undefined) return `meta[id='${tag.id}']`;
  if (tag.property !== undefined) return `meta[property='${tag.property}']`;
  if (tag.name !== undefined) return `meta[name='${tag.name}']`;
  return undefined;
}

function createMetaElement(tag: MetaTag): HTMLMetaElement {
  const element = document.createElement("meta");
  if (tag.id) element.setAttribute("id", tag.id);
  if (tag.property) element.setAttribute("property", tag.property);
  if (tag.name) element.setAttribute("name", tag.name);
  document.head.appendChild(element);
  return element;
}

export function pushMetaTags(tags: MetaTag[]): void {
  if (typeof document === "undefined") return;

  tags.forEach(tag => {
    if (tag.property === "og:title" && tag.content) {
      document.title = tag.content;
    }

    const selector = metaSelector(tag);
    if (!selector) return;

    const element =
      document.head.querySelector<HTMLMetaElement>(selector) ?? createMetaElement(tag);
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

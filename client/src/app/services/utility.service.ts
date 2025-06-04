import { Injectable } from '@angular/core';
import { Meta, MetaDefinition, Title } from '@angular/platform-browser';
import { v4 as Guid } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {

  constructor(
    private meta: Meta,
    private title: Title
  ) { }

  // META
  pushMetaTags(tags: MetaDefinition[]): void {

    tags.forEach((tag: MetaDefinition) => {

      if (tag.property === "og:title" && tag.content) {
        this.title.setTitle(tag.content);
      }

      // get best attribute
      const attrib =
        tag.id !== undefined
          ? `id='${tag.id}'`
          : tag.property !== undefined
            ? `property='${tag.property}'`
            : tag.name !== undefined
              ? `name='${tag.name}'`
              : "UNDEFINED";

      // check if tag exists
      const exists = this.meta.getTag(attrib);

      // update to replace
      if (exists !== null) {
        this.meta.updateTag(tag, attrib);
      }

      // or add if missing
      else {
        this.meta.addTag(tag);
      }
    });
  }

  titleWithSuffix(
    baseTitle: string,
    suffix: string = "Stock Indicators for .NET (demo)")
    : string {
    return baseTitle.length > 0
      ? baseTitle.concat(" | ").concat(suffix)
      : suffix;
  }

  // PAGE SCROLLING

  guid(prefix: string = 'chart'): string {
    return `${prefix}${Guid()}`;
  }

  scrollToStart(id: string, offset: number = 200) {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
      }
    }, offset);
  }

  scrollToEnd(id: string, offset: number = 200) {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
      }
    }, offset);
  }

}

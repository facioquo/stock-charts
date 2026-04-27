import type { InjectionKey } from "vue";

import type { IndyChartsVitePressOptions } from "./types";

export const indyChartsVitePressOptionsKey: InjectionKey<IndyChartsVitePressOptions> = Symbol(
  "indy-charts-vitepress-options"
);

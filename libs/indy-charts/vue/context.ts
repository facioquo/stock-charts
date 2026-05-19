import type { InjectionKey } from "vue";

import type { IndyChartsVueOptions } from "./types";

export const indyChartsVueOptionsKey: InjectionKey<IndyChartsVueOptions> =
  Symbol("indy-charts-vue-options");

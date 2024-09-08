// types for chartjs-plugin-crosshair

import {
  ChartType,
  InteractionModeFunction
} from 'chart.js';

interface LineOptions {
  color?: string | undefined;
  width?: number | undefined;
  dashPattern?: number[] | undefined;
}

interface SyncOptions {
  enabled?: boolean | undefined;
  group?: number | undefined;
  suppressTooltips?: boolean | undefined;
}

interface SnapOptions {
  enabled?: boolean | undefined;
}

interface CrosshairOptions {
  line?: LineOptions | undefined;
  sync?: SyncOptions | undefined;
  snap?: SnapOptions | undefined;
}

declare module 'chart.js' {

  interface PluginOptionsByType<TType extends ChartType> {
    crosshair?: CrosshairOptions | undefined;
  }

  interface InteractionModeMap {
    interpolate: InteractionModeFunction;
  }

  interface ChartDataSets {
    interpolate?: boolean | undefined;
  }
}

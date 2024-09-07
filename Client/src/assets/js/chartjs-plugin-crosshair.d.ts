// ref: // https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/chartjs-plugin-crosshair

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

interface ZoomOptions {
  enabled?: boolean | undefined;
  zoomboxBackgroundColor?: string | undefined;
  zoomboxBorderColor?: string | undefined;
  zoomButtonText?: string | undefined;
  zoomButtonClass?: string | undefined;
}

interface SnapOptions {
  enabled?: boolean | undefined;
}

interface CallbackOptions {
  beforeZoom?: ((start: number, end: number) => boolean) | undefined;
  afterZoom?: ((start: number, end: number) => void) | undefined;
}

interface CrosshairOptions {
  line?: LineOptions | undefined;
  sync?: SyncOptions | undefined;
  zoom?: ZoomOptions | undefined;
  snap?: SnapOptions | undefined;
  callbacks?: CallbackOptions | undefined;
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

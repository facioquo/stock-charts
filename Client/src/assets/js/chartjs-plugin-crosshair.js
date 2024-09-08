// chartjs-plugin-crosshair
// based on https://github.com/AbelHeinsbroek/chartjs-plugin-crosshair

// TODO:
// 1. fix mouse events to reach last data point in series
// 2. lock trace line on mouse click
// 3. migrate to native Angular/Typescript

import { Interaction } from 'chart.js';
import { valueOrDefault } from 'chart.js/helpers';

Interaction.modes.interpolate = interpolate;

function interpolate(chart, event, options) {

  var items = [];  // InteractionItem[]

  for (var datasetIndex = 0; datasetIndex < chart.data.datasets.length; datasetIndex++) {

    // check for interpolate setting
    if (!chart.data.datasets[datasetIndex].interpolate) {
      continue;
    }

    var meta = chart.getDatasetMeta(datasetIndex);
    // do not interpolate hidden charts
    if (meta.hidden) {
      continue;
    }

    var xScale = chart.scales[meta.xAxisID];
    var yScale = chart.scales[meta.yAxisID];

    var xValue = xScale.getValueForPixel(event.x);

    if (xValue > xScale.max || xValue < xScale.min) {
      continue;
    }

    var data = chart.data.datasets[datasetIndex].data;

    var index = data.findIndex(function (o) {
      return o.x >= xValue;
    });

    if (index === -1) {
      continue;
    }

    // linear interpolate value
    var prev = data[index - 1];
    var next = data[index];

    if (prev && next) {
      var slope = (next.y - prev.y) / (next.x - prev.x);
      var interpolatedValue = prev.y + (xValue - prev.x) * slope;
    }

    if (chart.data.datasets[datasetIndex].steppedLine && prev) {
      interpolatedValue = prev.y;
    }

    if (isNaN(interpolatedValue)) {
      continue;
    }

    var yPosition = yScale.getPixelForValue(interpolatedValue);

    // do not interpolate values outside of the axis limits
    if (isNaN(yPosition)) {
      continue;
    }

    // create a 'fake' event point
    var fakePoint = {
      hasValue: function () {
        return true;
      },
      tooltipPosition: function () {
        return this._model
      },
      _model: { x: event.x, y: yPosition },
      skip: false,
      stop: false,
      x: xValue,
      y: interpolatedValue
    };

    items.push({ datasetIndex: datasetIndex, element: fakePoint, index: 0 });
  }

  // add other, not interpolated, items
  var xItems = Interaction.modes.x(chart, event, options);
  for (index = 0; index < xItems.length; index++) {
    var item = xItems[index];
    if (!chart.data.datasets[item.datasetIndex].interpolate) {
      items.push(item);
    }
  }

  return items;
}

var defaultOptions = {
  line: {
    color: '#F66',
    width: 1,
    dashPattern: []
  },
  sync: {
    enabled: true,
    group: 1,
    suppressTooltips: false
  },
  snap: {
    enabled: false,
  }
};

var CrosshairPlugin = {

  id: 'crosshair',

  afterInit: function (chart) {

    if (!chart.config.options.scales.x) {
      return
    }

    var xScaleType = chart.config.options.scales.x.type;

    if (xScaleType !== 'linear' && xScaleType !== 'time' && xScaleType !== 'category' && xScaleType !== 'logarithmic') {
      return;
    }

    if (chart.options.plugins.crosshair === undefined) {
      chart.options.plugins.crosshair = defaultOptions;
    }

    chart.crosshair = {
      enabled: false,
      suppressUpdate: false,
      x: null,
      originalData: [],
      originalXRange: {},
      dragStarted: false,
      dragStartX: null,
      dragEndX: null,
      suppressTooltips: false,
      ignoreNextEvents: 0
    };

    var syncEnabled = this.getOption(chart, 'sync', 'enabled');
    if (syncEnabled) {
      chart.crosshair.syncEventHandler = function (event) {
        this.handleSyncEvent(chart, event);
      }.bind(this);

      window.addEventListener('sync-event', chart.crosshair.syncEventHandler);
    }
  },

  afterDestroy: function (chart) {
    var syncEnabled = this.getOption(chart, 'sync', 'enabled');
    if (syncEnabled) {
      window.removeEventListener('sync-event', chart.crosshair.syncEventHandler);
    }
  },

  getOption: function (chart, category, name) {
    return valueOrDefault(chart.options.plugins.crosshair[category] ? chart.options.plugins.crosshair[category][name] : undefined, defaultOptions[category][name]);
  },

  getXScale: function (chart) {
    return chart.data.datasets.length ? chart.scales[chart.getDatasetMeta(0).xAxisID] : null;
  },
  getYScale: function (chart) {
    return chart.scales[chart.getDatasetMeta(0).yAxisID];
  },

  handleSyncEvent: function (chart, event) {

    var syncGroup = this.getOption(chart, 'sync', 'group');

    // stop if the sync event was fired from this chart
    if (event.chartId === chart.id) {
      return;
    }

    // stop if the sync event was fired from a different group
    if (event.syncGroup !== syncGroup) {
      return;
    }

    var xScale = this.getXScale(chart);

    if (!xScale) {
      return;
    }

    // Safari fix
    var buttons = (event.original.native.buttons === undefined ? event.original.native.which : event.original.native.buttons);
    if (event.original.type === 'mouseup') {
      buttons = 0;
    }

    // bug fix: chartjs-plugin-crosshair/issues/95#issuecomment-1027262402
    var newEvent = {
      chart: chart,
      x: xScale.getPixelForValue(event.xValue),
      y: event.original.y,
      native: {
        buttons: buttons,
        type: event.original.type == "click" ? "mousemove" : event.original.type
      },
      stop: true
    };
    chart._eventHandler(newEvent);
  },

  afterEvent: function (chart, event) {

    if (chart.config.options.scales.x.length === 0) {
      return;
    }

    let e = event.event;

    var xScaleType = chart.config.options.scales.x.type;

    if (xScaleType !== 'linear' && xScaleType !== 'time' && xScaleType !== 'category' && xScaleType !== 'logarithmic') {
      return;
    }

    var xScale = this.getXScale(chart);

    if (!xScale) {
      return;
    }

    if (chart.crosshair.ignoreNextEvents > 0) {
      chart.crosshair.ignoreNextEvents -= 1;
      return;
    }

    // fix for Safari
    var buttons = (e.native.buttons === undefined ? e.native.which : e.native.buttons);
    if (e.native.type === 'mouseup') {
      buttons = 0;
    }

    var syncEnabled = this.getOption(chart, 'sync', 'enabled');
    var syncGroup = this.getOption(chart, 'sync', 'group');

    // fire event for all other linked charts
    if (!e.stop && syncEnabled) {
      var event = new CustomEvent('sync-event');
      event.chartId = chart.id;
      event.syncGroup = syncGroup;
      event.original = e;
      event.xValue = xScale.getValueForPixel(e.x);
      window.dispatchEvent(event);
    }

    // suppress tooltips for linked charts
    var suppressTooltips = this.getOption(chart, 'sync', 'suppressTooltips');

    chart.crosshair.suppressTooltips = e.stop && suppressTooltips;

    chart.crosshair.enabled = (e.type !== 'mouseout' && (e.x > xScale.getPixelForValue(xScale.min) && e.x < xScale.getPixelForValue(xScale.max)));

    if (!chart.crosshair.enabled && !chart.crosshair.suppressUpdate) {
      if (e.x > xScale.getPixelForValue(xScale.max)) {
        // suppress future updates to prevent endless redrawing of chart
        chart.crosshair.suppressUpdate = true;
        chart.update('none');
      }
      return;
    }
    chart.crosshair.suppressUpdate = false;
    chart.crosshair.x = e.x;
    chart.draw();
  },

  afterDraw: function (chart) {

    if (!chart.crosshair.enabled) {
      return;
    }

    this.drawTraceLine(chart);
    this.interpolateValues(chart);
    this.drawTracePoints(chart);
  },

  drawTraceLine: function (chart) {

    var yScale = this.getYScale(chart);

    var lineWidth = this.getOption(chart, 'line', 'width');
    var color = this.getOption(chart, 'line', 'color');
    var dashPattern = this.getOption(chart, 'line', 'dashPattern');
    var snapEnabled = this.getOption(chart, 'snap', 'enabled');

    var lineX = chart.crosshair.x;

    if (snapEnabled && chart._active.length) {
      lineX = chart._active[0].element.x;
    }

    chart.ctx.beginPath();
    chart.ctx.setLineDash(dashPattern);
    chart.ctx.moveTo(lineX, yScale.getPixelForValue(yScale.max));
    chart.ctx.lineWidth = lineWidth;
    chart.ctx.strokeStyle = color;
    chart.ctx.lineTo(lineX, yScale.getPixelForValue(yScale.min));
    chart.ctx.stroke();
    chart.ctx.setLineDash([]);
  },

  drawTracePoints: function (chart) {

    for (var chartIndex = 0; chartIndex < chart.data.datasets.length; chartIndex++) {

      var dataset = chart.data.datasets[chartIndex];
      var meta = chart.getDatasetMeta(chartIndex);

      var yScale = chart.scales[meta.yAxisID];

      if (meta.hidden || !dataset.interpolate) {
        continue;
      }

      chart.ctx.beginPath();
      chart.ctx.arc(chart.crosshair.x, yScale.getPixelForValue(dataset.interpolatedValue), 3, 0, 2 * Math.PI, false);
      chart.ctx.fillStyle = 'white';
      chart.ctx.lineWidth = 2;
      chart.ctx.strokeStyle = dataset.borderColor;
      chart.ctx.fill();
      chart.ctx.stroke();
    }

  },

  interpolateValues: function (chart) {

    for (var chartIndex = 0; chartIndex < chart.data.datasets.length; chartIndex++) {

      var dataset = chart.data.datasets[chartIndex];

      var meta = chart.getDatasetMeta(chartIndex);

      var xScale = chart.scales[meta.xAxisID];
      var xValue = xScale.getValueForPixel(chart.crosshair.x);

      if (meta.hidden || !dataset.interpolate) {
        continue;
      }

      var data = dataset.data;
      var index = data.findIndex(function (o) {
        return o.x >= xValue;
      });
      var prev = data[index - 1];
      var next = data[index];

      if (chart.data.datasets[chartIndex].steppedLine && prev) {
        dataset.interpolatedValue = prev.y;
      } else if (prev && next) {
        var slope = (next.y - prev.y) / (next.x - prev.x);
        dataset.interpolatedValue = prev.y + (xValue - prev.x) * slope;
      } else {
        dataset.interpolatedValue = NaN;
      }
    }

  }

};

export {
  CrosshairPlugin,
  interpolate as Interpolate,
  CrosshairPlugin as default
};

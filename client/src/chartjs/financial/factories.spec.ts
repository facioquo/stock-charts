/**
 * Unit tests for financial chart dataset factories
 */

import { ScatterDataPoint } from 'chart.js';
import {
  createCandlestickDataset,
  createVolumeDataset,
  createVolumeDatasetFromFinancialData,
  createFinancialChartBaseOptions,
  createCandlestickChartConfig,
  createOhlcChartConfig,
  addExtraFinancialBars,
  addExtraVolumeBars
} from './factories';
import { FinancialDataPoint } from './financial-chart.registry.d';
import { ENHANCED_FINANCIAL_COLORS } from './colors';

describe('Financial Chart Factories', () => {
  const sampleFinancialData: FinancialDataPoint[] = [
    { x: 1609459200000, o: 100, h: 110, l: 95, c: 105 }, // Bullish candle
    { x: 1609545600000, o: 105, h: 108, l: 98, c: 102 }, // Bearish candle
    { x: 1609632000000, o: 102, h: 102, l: 102, c: 102 }, // Unchanged candle
  ];

  const sampleVolumeData: ScatterDataPoint[] = [
    { x: 1609459200000, y: 1000000 },
    { x: 1609545600000, y: 1500000 },
    { x: 1609632000000, y: 800000 },
  ];

  describe('createCandlestickDataset', () => {
    it('should create a candlestick dataset with default options', () => {
      const dataset = createCandlestickDataset({
        data: sampleFinancialData
      });

      expect(dataset.type).toBe('candlestick');
      expect(dataset.label).toBe('Price');
      expect(dataset.data).toBe(sampleFinancialData);
      expect(dataset.yAxisID).toBe('y');
      expect(dataset.order).toBe(75);
    });

    it('should create a candlestick dataset with custom options', () => {
      const dataset = createCandlestickDataset({
        label: 'Custom Price',
        data: sampleFinancialData,
        yAxisID: 'price-axis',
        order: 100,
        colors: ENHANCED_FINANCIAL_COLORS
      });

      expect(dataset.type).toBe('candlestick');
      expect(dataset.label).toBe('Custom Price');
      expect(dataset.yAxisID).toBe('price-axis');
      expect(dataset.order).toBe(100);
    });
  });

  describe('createVolumeDataset', () => {
    it('should create a volume dataset with default options', () => {
      const dataset = createVolumeDataset({
        data: sampleVolumeData
      });

      expect(dataset.type).toBe('bar');
      expect(dataset.label).toBe('Volume');
      expect(dataset.data).toBe(sampleVolumeData);
      expect(dataset.yAxisID).toBe('volumeAxis');
      expect(dataset.order).toBe(76);
      expect(dataset.borderWidth).toBe(0);
      expect(Array.isArray(dataset.backgroundColor)).toBe(true);
    });

    it('should create a volume dataset with custom options', () => {
      const dataset = createVolumeDataset({
        label: 'Custom Volume',
        data: sampleVolumeData,
        yAxisID: 'vol-axis',
        order: 200
      });

      expect(dataset.label).toBe('Custom Volume');
      expect(dataset.yAxisID).toBe('vol-axis');
      expect(dataset.order).toBe(200);
    });
  });

  describe('createVolumeDatasetFromFinancialData', () => {
    it('should create volume dataset with colors based on financial data', () => {
      const dataset = createVolumeDatasetFromFinancialData(
        sampleVolumeData,
        sampleFinancialData
      );

      expect(dataset.type).toBe('bar');
      expect(dataset.label).toBe('Volume');
      expect(Array.isArray(dataset.backgroundColor)).toBe(true);
      
      const colors = dataset.backgroundColor as string[];
      expect(colors).toHaveLength(3);
      
      // First candle: close (105) > open (100) -> up color
      expect(colors[0]).toContain('1B5E20'); // Should contain up color
      
      // Second candle: close (102) < open (105) -> down color  
      expect(colors[1]).toContain('B71C1C'); // Should contain down color
      
      // Third candle: close (102) = open (102) -> up color (>= condition)
      expect(colors[2]).toContain('1B5E20'); // Should contain up color
    });
  });

  describe('createFinancialChartBaseOptions', () => {
    it('should create base options with defaults', () => {
      const options = createFinancialChartBaseOptions();

      expect(options.responsive).toBe(true);
      expect(options.maintainAspectRatio).toBe(false);
      expect(options.plugins?.legend?.display).toBe(false);
      expect(options.plugins?.tooltip?.intersect).toBe(false);
      expect(options.plugins?.tooltip?.mode).toBe('index');
      expect(options.scales?.x?.type).toBe('timeseries');
      expect(options.scales?.y?.type).toBe('linear');
      expect(options.scales?.volumeAxis?.type).toBe('linear');
    });

    it('should create base options with custom settings', () => {
      const options = createFinancialChartBaseOptions({
        responsive: false,
        maintainAspectRatio: true,
        volumeAxisSize: 10000
      });

      expect(options.responsive).toBe(false);
      expect(options.maintainAspectRatio).toBe(true);
      expect(options.scales?.volumeAxis?.max).toBe(10000);
    });
  });

  describe('createCandlestickChartConfig', () => {
    it('should create complete candlestick chart config without volume', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);

      expect(config.type).toBe('line');
      expect(config.data.datasets).toHaveLength(1);
      expect(config.data.datasets[0].type).toBe('candlestick');
      expect(config.options).toBeDefined();
    });

    it('should create complete candlestick chart config with volume', () => {
      const config = createCandlestickChartConfig(
        sampleFinancialData,
        sampleVolumeData
      );

      expect(config.data.datasets).toHaveLength(2);
      expect(config.data.datasets[0].type).toBe('candlestick');
      expect(config.data.datasets[1].type).toBe('bar');
      expect(config.data.datasets[1].label).toBe('Volume');
    });
  });

  describe('createOhlcChartConfig', () => {
    it('should create complete OHLC chart config', () => {
      const config = createOhlcChartConfig(sampleFinancialData);

      expect(config.type).toBe('line');
      expect(config.data.datasets).toHaveLength(1);
      expect(config.data.datasets[0].type).toBe('ohlc');
      expect(config.data.datasets[0].label).toBe('Price');
    });
  });

  describe('addExtraFinancialBars', () => {
    it('should add extra bars to financial data', () => {
      const result = addExtraFinancialBars(sampleFinancialData, 3);

      expect(result).toHaveLength(sampleFinancialData.length + 3);
      
      // Original data should be unchanged
      for (let i = 0; i < sampleFinancialData.length; i++) {
        expect(result[i]).toEqual(sampleFinancialData[i]);
      }
      
      // Extra bars should have NaN values
      for (let i = sampleFinancialData.length; i < result.length; i++) {
        expect(isNaN(result[i].o)).toBe(true);
        expect(isNaN(result[i].h)).toBe(true);
        expect(isNaN(result[i].l)).toBe(true);
        expect(isNaN(result[i].c)).toBe(true);
        expect(result[i].x).toBeGreaterThan(sampleFinancialData[sampleFinancialData.length - 1].x);
      }
    });

    it('should handle empty data', () => {
      const result = addExtraFinancialBars([], 3);
      expect(result).toHaveLength(0);
    });
  });

  describe('addExtraVolumeBars', () => {
    it('should add extra bars to volume data', () => {
      const result = addExtraVolumeBars(sampleVolumeData, 2);

      expect(result).toHaveLength(sampleVolumeData.length + 2);
      
      // Original data should be unchanged
      for (let i = 0; i < sampleVolumeData.length; i++) {
        expect(result[i]).toEqual(sampleVolumeData[i]);
      }
      
      // Extra bars should have NaN values
      for (let i = sampleVolumeData.length; i < result.length; i++) {
        expect(isNaN(result[i].y)).toBe(true);
        expect(result[i].x).toBeGreaterThan(sampleVolumeData[sampleVolumeData.length - 1].x);
      }
    });

    it('should handle empty data', () => {
      const result = addExtraVolumeBars([], 2);
      expect(result).toHaveLength(0);
    });
  });
});
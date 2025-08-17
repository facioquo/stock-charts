/**
 * Integration test for financial chart rendering
 * Tests the complete chart creation and rendering pipeline
 */

import { Chart } from 'chart.js';
import { ensureFinancialChartsRegistered } from '../../../chartjs/financial/register-financial';
import { createCandlestickChartConfig } from '../../../chartjs/financial/factories';
import { FinancialDataPoint } from '../../../chartjs/financial/financial-chart.registry.d';

// Mock canvas for testing
class MockCanvasRenderingContext2D {
  fillStyle: any = '#000000';
  strokeStyle: any = '#000000';
  lineWidth: number = 1;
  
  beginPath = jest.fn();
  closePath = jest.fn();
  moveTo = jest.fn();
  lineTo = jest.fn();
  stroke = jest.fn();
  fill = jest.fn();
  fillRect = jest.fn();
  strokeRect = jest.fn();
  clearRect = jest.fn();
  save = jest.fn();
  restore = jest.fn();
  translate = jest.fn();
  scale = jest.fn();
  clip = jest.fn();
  setLineDash = jest.fn();
  getLineDash = jest.fn(() => []);
  
  // Mock text methods
  measureText = jest.fn(() => ({ width: 10 }));
  fillText = jest.fn();
  strokeText = jest.fn();
  
  // Mock path methods
  rect = jest.fn();
  arc = jest.fn();
  
  // Mock image methods
  drawImage = jest.fn();
  createImageData = jest.fn();
  getImageData = jest.fn();
  putImageData = jest.fn();
}

class MockCanvasElement {
  width = 400;
  height = 300;
  style: any = {};
  
  getContext = jest.fn(() => new MockCanvasRenderingContext2D());
  toDataURL = jest.fn(() => 'data:image/png;base64,mock');
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn();
  
  // Mock positioning
  getBoundingClientRect = jest.fn(() => ({
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    top: 0,
    right: 400,
    bottom: 300,
    left: 0
  }));
  
  offsetParent = null;
  offsetTop = 0;
  offsetLeft = 0;
  offsetWidth = 400;
  offsetHeight = 300;
  clientWidth = 400;
  clientHeight = 300;
}

describe('Financial Chart Integration', () => {
  const sampleFinancialData: FinancialDataPoint[] = [
    { x: 1609459200000, o: 100, h: 110, l: 95, c: 105 },
    { x: 1609545600000, o: 105, h: 115, l: 100, c: 112 },
    { x: 1609632000000, o: 112, h: 118, l: 108, c: 115 },
    { x: 1609718400000, o: 115, h: 120, l: 110, c: 108 },
    { x: 1609804800000, o: 108, h: 113, l: 105, c: 111 },
  ];

  let mockCanvas: MockCanvasElement;
  let chart: Chart;

  beforeEach(() => {
    // Ensure financial charts are registered
    ensureFinancialChartsRegistered();
    
    // Create mock canvas
    mockCanvas = new MockCanvasElement();
    
    // Mock document.getElementById to return our mock canvas
    jest.spyOn(document, 'getElementById').mockReturnValue(mockCanvas as any);
  });

  afterEach(() => {
    if (chart) {
      chart.destroy();
    }
    jest.restoreAllMocks();
  });

  describe('Candlestick Chart Creation', () => {
    it('should create a candlestick chart successfully', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
      
      expect(chart).toBeDefined();
      expect(chart.config.type).toBe('line');
      expect(chart.config.data.datasets).toHaveLength(1);
      expect(chart.config.data.datasets[0].type).toBe('candlestick');
    });

    it('should create a candlestick chart with volume', () => {
      const volumeData = sampleFinancialData.map(d => ({ x: d.x, y: Math.random() * 1000000 }));
      const config = createCandlestickChartConfig(sampleFinancialData, volumeData);
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
      
      expect(chart.config.data.datasets).toHaveLength(2);
      expect(chart.config.data.datasets[0].type).toBe('candlestick');
      expect(chart.config.data.datasets[1].type).toBe('bar');
    });

    it('should handle chart updates without errors', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(() => {
        chart.update();
      }).not.toThrow();
      
      expect(() => {
        chart.update('none');
      }).not.toThrow();
    });

    it('should handle chart resize without errors', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(() => {
        chart.resize();
      }).not.toThrow();
    });
  });

  describe('Chart Configuration Validation', () => {
    it('should have correct scale configuration', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(chart.config.options?.scales?.x?.type).toBe('timeseries');
      expect(chart.config.options?.scales?.y?.type).toBe('linear');
      expect(chart.config.options?.scales?.volumeAxis?.type).toBe('linear');
    });

    it('should have correct plugin configuration', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(chart.config.options?.plugins?.legend?.display).toBe(false);
      expect(chart.config.options?.plugins?.tooltip?.intersect).toBe(false);
      expect(chart.config.options?.plugins?.tooltip?.mode).toBe('index');
    });

    it('should have responsive configuration', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(chart.config.options?.responsive).toBe(true);
      expect(chart.config.options?.maintainAspectRatio).toBe(false);
    });
  });

  describe('Data Handling', () => {
    it('should handle empty financial data gracefully', () => {
      const config = createCandlestickChartConfig([]);
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
      
      expect(chart.config.data.datasets[0].data).toHaveLength(0);
    });

    it('should handle financial data with NaN values', () => {
      const dataWithNaN: FinancialDataPoint[] = [
        { x: 1609459200000, o: 100, h: 110, l: 95, c: 105 },
        { x: 1609545600000, o: NaN, h: NaN, l: NaN, c: NaN },
        { x: 1609632000000, o: 112, h: 118, l: 108, c: 115 },
      ];
      
      const config = createCandlestickChartConfig(dataWithNaN);
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
    });

    it('should handle large datasets', () => {
      const largeDataset: FinancialDataPoint[] = [];
      const baseTime = 1609459200000;
      
      for (let i = 0; i < 1000; i++) {
        const open = 100 + Math.random() * 20;
        const close = open + (Math.random() - 0.5) * 10;
        const high = Math.max(open, close) + Math.random() * 5;
        const low = Math.min(open, close) - Math.random() * 5;
        
        largeDataset.push({
          x: baseTime + i * 86400000, // Daily data
          o: open,
          h: high,
          l: low,
          c: close
        });
      }
      
      const config = createCandlestickChartConfig(largeDataset);
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
      
      expect(chart.config.data.datasets[0].data).toHaveLength(1000);
    });
  });

  describe('Memory Management', () => {
    it('should clean up chart resources on destroy', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      chart = new Chart(mockCanvas.getContext('2d')!, config);
      
      expect(() => {
        chart.destroy();
      }).not.toThrow();
      
      // Chart should be destroyed and not usable
      expect(() => {
        chart.update();
      }).toThrow();
    });

    it('should handle multiple chart creation and destruction', () => {
      for (let i = 0; i < 10; i++) {
        const config = createCandlestickChartConfig(sampleFinancialData);
        const tempChart = new Chart(mockCanvas.getContext('2d')!, config);
        
        expect(tempChart).toBeDefined();
        
        tempChart.destroy();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        { x: 'invalid', o: 100, h: 110, l: 95, c: 105 },
        { x: 1609545600000, o: 'invalid', h: 115, l: 100, c: 112 },
      ] as any;
      
      const config = createCandlestickChartConfig(invalidData);
      
      // Chart should be created but may not render properly
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
    });

    it('should handle malformed configuration gracefully', () => {
      const config = createCandlestickChartConfig(sampleFinancialData);
      
      // Corrupt the configuration
      (config.options as any) = null;
      
      expect(() => {
        chart = new Chart(mockCanvas.getContext('2d')!, config);
      }).not.toThrow();
    });
  });
});
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Chart, ChartConfiguration, ChartType } from "chart.js";
import { Quote, IndicatorListing } from "../app/pages/chart/chart.models";
import { ChartService } from "../app/services/chart.service";
import { WindowService } from "../app/services/window.service";
import { MediaQueryService } from "../app/services/media-query.service";

/**
 * Chart Test Harness utility for comprehensive chart testing
 * Part of issue #414 - Hardening Chart Testing Strategy
 */
export class ChartTestHarness {
  private chartInstance: Chart | null = null;
  private mockWindowService: Partial<WindowService> = {};
  private mockMediaQueryService: Partial<MediaQueryService> = {};

  constructor(
    private component: any,
    private fixture: ComponentFixture<any>
  ) {}

  /**
   * Create a chart component with test data and configuration
   */
  static async create<T>(
    componentType: new (...args: any[]) => T,
    testData: {
      quotes?: Quote[];
      indicators?: IndicatorListing[];
      windowSize?: { width: number; height: number };
    } = {}
  ): Promise<ChartTestHarness> {
    await TestBed.configureTestingModule({
      declarations: [componentType],
      providers: [
        ChartService,
        {
          provide: WindowService,
          useValue: {
            getWindowSize: () => testData.windowSize ?? { width: 1024, height: 768 },
            calculateOptimalBars: (width?: number) => Math.floor((width ?? 1024) / 5),
            isDynamicResizeEnabled: () => true,
            getResizeObservable: () => ({
              pipe: () => ({ subscribe: () => ({ unsubscribe: () => {} }) })
            })
          }
        },
        {
          provide: MediaQueryService,
          useValue: {
            matches: jest.fn().mockReturnValue(false),
            isMobile: jest.fn().mockReturnValue(false),
            isTablet: jest.fn().mockReturnValue(false),
            isDesktop: jest.fn().mockReturnValue(true)
          }
        }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(componentType);
    const component = fixture.componentInstance;

    return new ChartTestHarness(component, fixture);
  }

  /**
   * Inject test data into the component
   */
  injectData(data: { quotes?: Quote[]; indicators?: IndicatorListing[] }): this {
    if (data.quotes && this.component.chartService) {
      this.component.chartService.allQuotes = data.quotes;
    }
    if (data.indicators && this.component.chartService) {
      this.component.chartService.indicatorListings = data.indicators;
    }
    return this;
  }

  /**
   * Get the Chart.js instance if available
   */
  getChartInstance(): Chart | null {
    // Try to find chart instance in various ways
    if (this.chartInstance) {
      return this.chartInstance;
    }

    // Look for canvas elements and try to get chart instances
    const canvasElements = this.fixture.nativeElement.querySelectorAll("canvas");
    for (const canvas of canvasElements) {
      const chart = Chart.getChart(canvas);
      if (chart) {
        this.chartInstance = chart;
        return chart;
      }
    }

    return null;
  }

  /**
   * Trigger a resize event with specific dimensions
   */
  triggerResize(width: number, height: number): this {
    // Update mock window service
    if (this.mockWindowService.getWindowSize) {
      this.mockWindowService.getWindowSize = () => ({ width, height });
    }

    // Trigger component resize if method exists
    if (this.component.onWindowResize) {
      this.component.onWindowResize({ width, height });
    }

    this.fixture.detectChanges();
    return this;
  }

  /**
   * Get chart configuration for testing
   */
  getChartConfig(): ChartConfiguration | null {
    const chart = this.getChartInstance();
    return chart ? chart.config : null;
  }

  /**
   * Get chart datasets
   */
  getChartDatasets() {
    const chart = this.getChartInstance();
    return chart ? chart.data.datasets : [];
  }

  /**
   * Assert chart dimensions
   */
  assertDimensions(expectedWidth: number, expectedHeight: number): this {
    const chart = this.getChartInstance();
    expect(chart).toBeTruthy();

    if (chart) {
      expect(chart.width).toBe(expectedWidth);
      expect(chart.height).toBe(expectedHeight);
    }

    return this;
  }

  /**
   * Assert chart has expected number of datasets
   */
  assertDatasetCount(expectedCount: number): this {
    const datasets = this.getChartDatasets();
    expect(datasets).toHaveLength(expectedCount);
    return this;
  }

  /**
   * Assert chart data points count
   */
  assertDataPointCount(datasetIndex: number, expectedCount: number): this {
    const datasets = this.getChartDatasets();
    expect(datasets[datasetIndex]).toBeTruthy();
    expect(datasets[datasetIndex].data).toHaveLength(expectedCount);
    return this;
  }

  /**
   * Wait for chart animations to complete
   */
  async waitForAnimations(): Promise<this> {
    const chart = this.getChartInstance();
    if (chart) {
      return new Promise(resolve => {
        chart.options.animation = {
          ...chart.options.animation,
          onComplete: () => resolve(this)
        };
        chart.update();
      });
    }
    return this;
  }

  /**
   * Destroy the chart and clean up
   */
  destroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
}

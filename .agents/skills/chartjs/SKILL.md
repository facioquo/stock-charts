---
name: chartjs
description: Build data visualizations using Chart.js with TypeScript
---

# Chart.js data visualization development

Build production-quality data visualizations using Chart.js with TypeScript for interactive charts, graphs, and dashboards across React, Angular, and other frameworks.

## When to use this skill

- Building interactive charts and graphs (line, bar, pie, doughnut, radar, etc.)
- Creating data dashboards with standard chart types
- Simple to moderately complex data visualizations
- Projects requiring responsive, accessible charts
- Applications needing animation and interactivity
- Complex financial analytics and indicator charts

## Required tools

- #tool:execute - Run npm/pnpm commands (build, test, dev)
- #tool:edit - Modify source files
- #tool:search - Find patterns in codebase
- #tool:read - Read existing code and configurations
- #tool:web - Fetching official documentation
- #tool:github/search_repositories - To retrieve information about a GitHub repository
- #tool:github/web_search - Find answers to specific questions not covered in documentation

## Workflow

### Step 1: Query authoritative sources

Use Chart.js documentation for current best practices:

- Check Chart.js documentation at <https://chartjs.org/docs>
- Review Chart.js GitHub repository at <https://github.com/chartjs/Chart.js>
- Verify TypeScript type definitions from the `chart.js` package

### Step 2: Review existing patterns

Search codebase for similar implementations:

- Look for existing Chart.js components or services
- Identify repository structure and naming conventions
- Check for existing chart configurations and themes
- Review data transformation patterns

### Step 3: Implement code

Follow these core principles:

**Type safety**:

- Use TypeScript with Chart.js type definitions (`chart.js`)
- Define explicit types for chart data and options
- Avoid `any` type for chart configurations
- Use proper typing for plugins and custom elements

**Framework integration**:

- Use `chart.js` directly via canvas refs in all frameworks
- Ensure proper component lifecycle management (create on mount, destroy on unmount)
- Handle chart updates and rerendering efficiently

**Chart configuration**:

- Use responsive options for mobile support
- Configure proper accessibility labels and ARIA attributes
- Implement consistent color schemes using design tokens
- Configure animations appropriately for UX

**Data handling**:

- Transform API data to Chart.js format
- Handle loading and error states
- Implement real-time updates when needed
- Optimize large datasets with sampling/decimation

**Best practices**:

```typescript
// ✅ Good - Typed Chart.js configuration
import { Chart, ChartConfiguration, ChartData } from "chart.js";

interface SalesData {
  month: string;
  revenue: number;
}

function createChartData(data: SalesData[]): ChartData<"line"> {
  return {
    labels: data.map(d => d.month),
    datasets: [{
      label: "Revenue",
      data: data.map(d => d.revenue),
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1
    }]
  };
}

const config: ChartConfiguration<"line"> = {
  type: "line",
  data: createChartData(salesData),
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top"
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }
};
```

**React integration example**:

```typescript
// ✅ Good - React Chart.js component with TypeScript
import { useEffect, useRef } from "react";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from "chart.js";

// Register required Chart.js components once at module level
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface SalesChartProps {
  data: SalesData[];
  loading?: boolean;
}

export function SalesChart({ data, loading }: SalesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<"line"> | null>(null);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const chartData: ChartData<"line"> = {
      labels: data.map(d => d.month),
      datasets: [{
        label: "Monthly Revenue",
        data: data.map(d => d.revenue),
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.1
      }]
    };

    const options: ChartOptions<"line"> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Sales Performance" }
      }
    };

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: chartData,
      options
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [data, loading]);

  if (loading) {
    return <div>Loading chart...</div>;
  }

  return (
    <div style={{ height: "400px", position: "relative" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
```

**Angular integration example**:

```typescript
// ✅ Good - Angular Chart.js component with TypeScript
import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from "@angular/core";
import { Chart, ChartConfiguration, ChartData } from "chart.js";

@Component({
  selector: "app-sales-chart",
  template: `
    <div class="chart-container">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      position: relative;
      height: 400px;
      width: 100%;
    }
  `]
})
export class SalesChartComponent implements AfterViewInit, OnDestroy {
  @Input() data: SalesData[] = [];
  @ViewChild("chartCanvas") chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  ngAfterViewInit(): void {
    this.createChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private createChart(): void {
    const config: ChartConfiguration<"line"> = {
      type: "line",
      data: this.getChartData(),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top"
          }
        }
      }
    };

    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  private getChartData(): ChartData<"line"> {
    return {
      labels: this.data.map(d => d.month),
      datasets: [{
        label: "Revenue",
        data: this.data.map(d => d.revenue),
        borderColor: "rgb(75, 192, 192)"
      }]
    };
  }
}
```

### Step 4: Format and validate

```bash
pnpm run lint --fix    # Fix ESLint errors
prettier --write src/  # Format code
pnpm run build         # Verify compilation
pnpm test              # Run tests
```

### Step 5: Check for errors

Review the Problems panel for compilation errors and warnings.

## Completion criteria/quality standards

- Code compiles without errors or warnings
- Prettier and linter pass
- Build succeeds
- Charts render correctly and are responsive
- TypeScript strict mode satisfied (no `any` types)
- Proper accessibility labels configured
- Loading and error states handled
- Chart updates efficiently on data changes

---

## Common chart types and configurations

### Line charts

Best for: Time series data, trends over time

```typescript
const config: ChartConfiguration<"line"> = {
  type: "line",
  data: chartData,
  options: {
    responsive: true,
    plugins: {
      legend: { position: "top" }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
};
```

### Bar charts

Best for: Comparing categories, discrete data points

```typescript
const config: ChartConfiguration<"bar"> = {
  type: "bar",
  data: chartData,
  options: {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
};
```

### Pie/Doughnut charts

Best for: Part-to-whole relationships, proportions

```typescript
const config: ChartConfiguration<"doughnut"> = {
  type: "doughnut",
  data: chartData,
  options: {
    responsive: true,
    plugins: {
      legend: { position: "right" }
    }
  }
};
```

## Customizations and advanced features

See [official docs](https://chartjs.org/docs) for additional information on:

- [Chart.js types reference](https://www.chartjs.org/docs/latest/api/) for exports, enumerations, classes, and interfaces
- [Developer API reference](https://www.chartjs.org/docs/latest/developers/api.html)
- [Extending chart types](https://www.chartjs.org/docs/latest/developers/charts.html#extending-existing-chart-types) and [derived chart types](https://www.chartjs.org/docs/latest/samples/advanced/derived-chart-type.html)
- [Customizing with Plugins](https://www.chartjs.org/docs/latest/developers/plugins.html)
- [Updating charts](https://www.chartjs.org/docs/latest/developers/updates.html)
  - adding or removing data
  - updating chart options
- [Animations](https://www.chartjs.org/docs/latest/configuration/animations.html)
- [Building extensions](https://www.chartjs.org/docs/latest/developers/publishing.html) with ESM and Rollup

## Performance optimization

- Use `decimation` plugin for large datasets
- Implement virtual scrolling for real-time data
- Disable animations for frequently updating charts
- Use `parsing: false` for pre-formatted data
- Consider chart pooling for dashboard with many charts

## Additional references

- Chart.js documentation: <https://chartjs.org/docs>
- Chart.js GitHub: <https://github.com/chartjs/Chart.js>
- Indy Charts GitHub: <https://github.com/facioquo/stock-charts> (this repository)

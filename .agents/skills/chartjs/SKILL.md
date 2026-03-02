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

**Angular integration example** (Angular v21, signals-based standalone):

```typescript
// ✅ Good - Angular v21 standalone component with signal inputs and reactive effect
import { Component, DestroyRef, effect, inject, input, viewChild, ElementRef } from "@angular/core";
import { Chart, ChartConfiguration } from "chart.js";

@Component({
  selector: "app-sales-chart",
  standalone: true,
  templateUrl: "./sales-chart.component.html",
  styleUrl: "./sales-chart.component.scss"
})
export class SalesChartComponent {
  readonly data = input<SalesData[]>([]);
  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>("chartCanvas");
  private chart?: Chart;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
    effect(() => {
      const el = this.canvas();
      if (!el) return;
      this.chart?.destroy();
      this.chart = new Chart(el.nativeElement, this.buildConfig());
    });
  }

  private buildConfig(): ChartConfiguration<"line"> {
    return {
      type: "line",
      data: {
        labels: this.data().map(d => d.month),
        datasets: [{
          label: "Revenue",
          data: this.data().map(d => d.revenue),
          borderColor: "rgb(75, 192, 192)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "top" } }
      }
    };
  }
}
```

For other frameworks (React, Vue, etc.), see the [Chart.js documentation](https://chartjs.org/docs).

### Step 4: Format and validate

pnpm run lint --fix    # Fix ESLint errors
pnpm run format        # Format code (uses project-configured prettier)
pnpm run build         # Verify compilation
pnpm test              # Run tests

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

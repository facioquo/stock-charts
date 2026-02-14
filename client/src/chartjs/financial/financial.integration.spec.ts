import { Chart } from "chart.js";
import { describe, expect, it } from "vitest";

import { registerFinancialCharts } from "./register-financial";

function createCanvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const base = {
    canvas,
    fillStyle: "#000",
    strokeStyle: "#000",
    lineWidth: 1,
    textAlign: "left",
    textBaseline: "alphabetic",
    save() {},
    restore() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    stroke() {},
    fill() {},
    fillRect() {},
    strokeRect() {},
    clearRect() {},
    rect() {},
    clip() {},
    arc() {},
    fillText() {},
    strokeText() {},
    setTransform() {},
    resetTransform() {},
    measureText(text: string) {
      return {
        width: text.length * 6
      };
    },
    createLinearGradient() {
      return {
        addColorStop() {}
      };
    }
  };

  return new Proxy(base, {
    get(target, key) {
      const value = target[key as keyof typeof target];
      if (value != null) return value;
      return () => undefined;
    }
  }) as unknown as CanvasRenderingContext2D;
}

describe("financial integration", () => {
  it("renders a minimal candlestick chart", () => {
    registerFinancialCharts();

    const canvas = document.createElement("canvas");
    Object.defineProperty(canvas, "getContext", {
      value: () => createCanvasContext(canvas),
      configurable: true
    });

    const chart = new Chart(canvas, {
      type: "candlestick",
      data: {
        datasets: [
          {
            type: "candlestick",
            label: "Price",
            data: [{ x: 1, o: 10, h: 12, l: 9, c: 11 }],
            yAxisID: "y"
          }
        ]
      },
      options: {
        animation: false,
        responsive: false,
        scales: {
          x: { type: "linear" },
          y: { type: "linear" }
        }
      }
    });

    expect(chart.config.data.datasets[0].type).toBe("candlestick");
    expect(chart.getDatasetMeta(0).type).toBe("candlestick");
    chart.destroy();
  });
});

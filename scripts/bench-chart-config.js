#!/usr/bin/env node

/**
 * Chart Performance Benchmark Script
 * Part of issue #414 - Hardening Chart Testing Strategy
 * Micro-benchmark large dataset config building
 */

import { randomInt } from 'crypto';

// Mock required modules for Node.js environment
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.document = {
  createElement: () => ({
    getContext: () => ({
      canvas: { width: 1920, height: 1080 },
      clearRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fillRect: () => {},
      arc: () => {},
      fill: () => {}
    })
  })
};

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  SMALL_DATASET: 50,   // 100 data points
  MEDIUM_DATASET: 100, // 1K data points
  LARGE_DATASET: 250,  // 5K data points
  HUGE_DATASET: 500    // 10K data points
};

/**
 * Generate test quote data
 */
// Secure-ish PRNG helpers (not for cryptography, but avoids Math.random flagged by static analysis)
// We intentionally use crypto.randomInt / randomBytes to satisfy security scanners.
function randFloat(min, max) {
  // randomInt is inclusive of min and exclusive of max
  const range = 1_000_000;
  const n = randomInt(0, range); // uniform integer
  const r = n / range; // 0..1
  return min + r * (max - min);
}

function generateTestQuotes(count) {
  const quotes = [];
  const startDate = new Date('2020-01-01');
  let price = 100;

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    // Random walk using crypto-based random for static analysis compliance
    const change = randFloat(-0.02, 0.02); // ±2%
    price *= (1 + change);

    const high = price * (1 + randFloat(0, 0.02));
    const low = price * (1 - randFloat(0, 0.02));
    const volume = Math.floor(randFloat(0, 1) * 1_000_000) + 500_000;

    quotes.push({
      date: date.toISOString().split('T')[0],
      open: price,
      high,
      low,
      close: price,
      volume
    });
  }

  return quotes;
}

/**
 * Mock ChartService for performance testing
 */
class MockChartService {
  constructor() {
    this.allQuotes = [];
    this.currentBarCount = 200;
    this.selectedPriceType = 'candle';
  }

  getOverlayChartConfig() {
    const startTime = performance.now();

    // Simulate chart config generation
    const quotes = this.allQuotes.slice(-this.currentBarCount);

    const priceDataset = {
      label: 'Price',
      data: quotes.map(q => ({
        x: q.date,
        o: q.open,
        h: q.high,
        l: q.low,
        c: q.close
      })),
      type: 'candlestick',
      borderColor: '#007bff'
    };

    const volumeDataset = {
      label: 'Volume',
      data: quotes.map(q => ({
        x: q.date,
        y: q.volume
      })),
      type: 'bar',
      backgroundColor: '#6c757d80'
    };

    const config = {
      type: 'line',
      data: {
        labels: quotes.map(q => q.date),
        datasets: [priceDataset, volumeDataset]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day' }
          },
          y: {
            type: 'linear',
            position: 'left'
          },
          volume: {
            type: 'linear',
            position: 'right',
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: { mode: 'index' }
        }
      }
    };

    const endTime = performance.now();
    return { config, duration: endTime - startTime };
  }

  addIndicatorData(indicatorCount = 3) {
    // Simulate adding multiple indicators
    const indicators = [];

    for (let i = 0; i < indicatorCount; i++) {
      const data = this.allQuotes.map((_, index) => ({
        x: this.allQuotes[index].date,
        y: randFloat(0, 100) // crypto-based pseudo-random (non-crypto usage)
      }));

      indicators.push({
        label: `Indicator ${i + 1}`,
        data,
        borderColor: `hsl(${i * 60}, 70%, 50%)`
      });
    }

    return indicators;
  }
}

/**
 * Run performance benchmark
 */
function runBenchmark() {
  console.log('🚀 Starting Chart Performance Benchmark...\n');

  const testCases = [
    { name: 'Small Dataset', count: 100, threshold: PERFORMANCE_THRESHOLDS.SMALL_DATASET },
    { name: 'Medium Dataset', count: 1000, threshold: PERFORMANCE_THRESHOLDS.MEDIUM_DATASET },
    { name: 'Large Dataset', count: 5000, threshold: PERFORMANCE_THRESHOLDS.LARGE_DATASET },
    { name: 'Huge Dataset', count: 10000, threshold: PERFORMANCE_THRESHOLDS.HUGE_DATASET }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`📊 Testing ${testCase.name} (${testCase.count} data points)`);

    const service = new MockChartService();
    service.allQuotes = generateTestQuotes(testCase.count);

    // Warm up
    service.getOverlayChartConfig();

    // Run multiple iterations for average
    const iterations = 10;
    const durations = [];

    for (let i = 0; i < iterations; i++) {
      const result = service.getOverlayChartConfig();
      durations.push(result.duration);
    }

    const averageDuration = durations.reduce((a, b) => a + b, 0) / iterations;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    const passed = averageDuration <= testCase.threshold;
    const status = passed ? '✅' : '❌';

    console.log(`  ${status} Average: ${averageDuration.toFixed(2)}ms (threshold: ${testCase.threshold}ms)`);
    console.log(`     Min: ${minDuration.toFixed(2)}ms, Max: ${maxDuration.toFixed(2)}ms`);

    results.push({
      ...testCase,
      averageDuration,
      minDuration,
      maxDuration,
      passed
    });

    console.log('');
  }

  // Test with multiple indicators
  console.log('📈 Testing with Multiple Indicators (1000 points + 5 indicators)');
  const complexService = new MockChartService();
  complexService.allQuotes = generateTestQuotes(1000);

  const complexStart = performance.now();
  const baseConfig = complexService.getOverlayChartConfig();
  const indicators = complexService.addIndicatorData(5);
  const complexEnd = performance.now();

  const complexDuration = complexEnd - complexStart;
  const complexPassed = complexDuration <= 200; // 200ms threshold for complex charts
  const complexStatus = complexPassed ? '✅' : '❌';

  console.log(`  ${complexStatus} Complex chart: ${complexDuration.toFixed(2)}ms (threshold: 200ms)\n`);

  // Memory usage test
  console.log('💾 Memory Usage Test');
  const memStart = process.memoryUsage();
  const hugeService = new MockChartService();
  hugeService.allQuotes = generateTestQuotes(50000); // 50K points
  hugeService.getOverlayChartConfig();
  const memEnd = process.memoryUsage();

  const memoryIncrease = (memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024;
  console.log(`  Memory increase: ${memoryIncrease.toFixed(2)} MB\n`);

  // Summary
  console.log('📋 Benchmark Summary');
  console.log('==================');

  const allPassed = results.every(r => r.passed) && complexPassed;
  const overallStatus = allPassed ? '✅' : '❌';

  console.log(`${overallStatus} Overall: ${allPassed ? 'PASSED' : 'FAILED'}`);

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.averageDuration.toFixed(2)}ms`);
  });

  console.log(`${complexStatus} Complex Chart: ${complexDuration.toFixed(2)}ms`);

  if (!allPassed) {
    console.log('\n⚠️  Some benchmarks failed. Consider optimizing chart configuration generation.');
    process.exit(1);
  } else {
    console.log('\n🎉 All performance benchmarks passed!');
  }
}

// Only run if not in CI environment (optional)
if (process.env.SKIP_PERFORMANCE_TESTS !== 'true') {
  runBenchmark();
} else {
  console.log('⏭️  Performance tests skipped (SKIP_PERFORMANCE_TESTS=true)');
}

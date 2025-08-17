const { createCjsPreset } = require('jest-preset-angular/presets');

/** @type {import('jest').Config} */
module.exports = {
  ...createCjsPreset(),
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts', 'jest-canvas-mock'],
  // Explicit testMatch retained (Jest 30 auto-detect may suffice, keep for clarity)
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/**/*.module.ts',
    '!src/**/environment*.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['html', 'text-summary', 'lcov'],
  // Minimal baseline thresholds (current overall ~17%); set just below to avoid failing now
  // and encourage incremental improvement. Increase these as test coverage grows.
  coverageThreshold: { global: { statements: 15, branches: 15, functions: 15, lines: 15 } },
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results', outputName: 'junit.xml' }]
  ]
};

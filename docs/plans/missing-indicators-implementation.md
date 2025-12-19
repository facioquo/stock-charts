# Plan for Missing Indicators Implementation

This plan outlines the implementation of all missing indicators from the Skender.Stock.Indicators library that are not yet available in this demo site's chart.

## Missing Indicators Checklist

The following indicators are available in the Stock.Indicators library but not yet implemented in this demo site. Each will be implemented following the existing patterns in `Endpoints.cs` and `Service.Metadata.cs`.

### Moving Averages

- [ ] DEMA - Double Exponential Moving Average
- [ ] HMA - Hull Moving Average
- [ ] KAMA - Kaufman Adaptive Moving Average
- [ ] MAMA - MESA Adaptive Moving Average
- [ ] SMMA - Smoothed Moving Average
- [ ] T3 - Tillson T3 Moving Average
- [ ] TEMA - Triple Exponential Moving Average
- [ ] WMA - Weighted Moving Average

### Oscillators

- [ ] Awesome - Awesome Oscillator
- [ ] BOP - Balance of Power
- [ ] ChaikinOsc - Chaikin Oscillator
- [ ] DPO - Detrended Price Oscillator
- [ ] PMO - Price Momentum Oscillator
- [ ] TRIX - Triple Exponential Average Rate of Change
- [ ] TSI - True Strength Index
- [ ] Ultimate - Ultimate Oscillator
- [ ] WilliamsR - Williams %R

### Volume-Based

- [ ] OBV - On-Balance Volume
- [ ] PVO - Percentage Volume Oscillator
- [ ] VWAP - Volume Weighted Average Price
- [ ] VWMA - Volume Weighted Moving Average
- [ ] KVO - Klinger Volume Oscillator

### Price Channels and Bands

- [ ] MaEnvelopes - Moving Average Envelopes
- [ ] StdDevChannels - Standard Deviation Channels

### Other Indicators

- [ ] Correlation - Correlation Coefficient
- [ ] ForceIndex - Force Index
- [ ] HeikinAshi - Heikin-Ashi
- [ ] Hurst - Hurst Exponent
- [ ] PivotPoints - Pivot Points
- [ ] Pivots - Rolling Pivots
- [ ] PRS - Price Relative Strength
- [ ] RocWb - Rate of Change with Bands
- [ ] RollingPivots - Rolling Pivot Points
- [ ] VolatilityStop - Volatility Stop

## Implementation Pattern

For each indicator, the following steps are required:

1. **Add HTTP endpoint** in `server/WebApi/Endpoints.cs` following existing pattern
2. **Add metadata configuration** in `server/WebApi/Services/Service.Metadata.cs`
3. **Update backup indicators** by running `pnpm run generate:backup-indicators`
4. **Verify build and tests pass**

## Progress Notes

Implementation will be done one indicator at a time, checking off each indicator as it is completed.

---

Last updated: December 19, 2025

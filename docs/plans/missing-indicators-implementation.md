# Plan for Missing Indicators Implementation

This plan outlines the implementation of all missing indicators from the Skender.Stock.Indicators library that are not yet available in this demo site's chart.

## Missing Indicators Checklist

The following indicators are available in the Stock.Indicators library but not yet implemented in this demo site. Each will be implemented following the existing patterns in `Endpoints.cs` and `Service.Metadata.cs`.

### Moving Averages

- [x] DEMA - Double Exponential Moving Average
- [x] HMA - Hull Moving Average
- [x] KAMA - Kaufman Adaptive Moving Average
- [x] MAMA - MESA Adaptive Moving Average
- [x] SMMA - Smoothed Moving Average
- [x] T3 - Tillson T3 Moving Average
- [x] TEMA - Triple Exponential Moving Average
- [x] WMA - Weighted Moving Average

### Oscillators

- [x] Awesome - Awesome Oscillator
- [x] BOP - Balance of Power
- [x] ChaikinOsc - Chaikin Oscillator
- [x] DPO - Detrended Price Oscillator
- [x] PMO - Price Momentum Oscillator
- [x] TRIX - Triple Exponential Average Rate of Change
- [x] TSI - True Strength Index
- [x] Ultimate - Ultimate Oscillator
- [x] WilliamsR - Williams %R

### Volume-Based

- [x] OBV - On-Balance Volume
- [x] PVO - Percentage Volume Oscillator
- [x] VWAP - Volume Weighted Average Price
- [x] VWMA - Volume Weighted Moving Average
- [x] KVO - Klinger Volume Oscillator

### Price Channels and Bands

- [x] MaEnvelopes - Moving Average Envelopes
- [x] StdDevChannels - Standard Deviation Channels

### Other Indicators

- [ ] Correlation - Correlation Coefficient (requires dual quote comparison)
- [x] ForceIndex - Force Index
- [ ] HeikinAshi - Heikin-Ashi (candle transformation, not chart overlay)
- [x] Hurst - Hurst Exponent
- [ ] PivotPoints - Pivot Points (static calculations, different structure)
- [ ] Pivots - Rolling Pivots (different structure)
- [ ] PRS - Price Relative Strength (requires dual quote comparison)
- [x] RocWb - Rate of Change with Bands
- [ ] RollingPivots - Rolling Pivot Points (different structure)
- [x] VolatilityStop - Volatility Stop

## Implementation Pattern

For each indicator, the following steps are required:

1. **Add HTTP endpoint** in `server/WebApi/Endpoints.cs` following existing pattern
2. **Add metadata configuration** in `server/WebApi/Services/Service.Metadata.cs`
3. **Update backup indicators** by running `pnpm run generate:backup-indicators`
4. **Verify build and tests pass**

## Progress Notes

**Completed:** 30 indicators implemented
**Remaining:** 6 indicators (most require special handling - dual quote comparison or different data structures)

Indicators not implemented due to complexity:

- **Correlation, PRS**: Require comparison with another security's quotes (like Beta)
- **HeikinAshi**: Transforms candlesticks rather than creating overlay/oscillator
- **PivotPoints, Pivots, RollingPivots**: Return different data structures (pivot levels)

---

Last updated: December 19, 2025

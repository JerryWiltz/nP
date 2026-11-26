<!-- Modified: 2026-11-26 -->
# Output-unit contract

Open [outputUnits.html](outputUnits.html) with the current local browser bundle.
It shows RF frequency in GHz, BJT collector current in mA, a square waveform in
ns/mV and its calibrated RMS spectrum in MHz/mV. Named `.out()` calls own all
unit conversions. The chart and table calls omit `metricPrefix`: original
results carrying explicit unit selections are already scaled for display.

Underlying RF/curve data and waveform samples retain their native units.
FFT's `dBV` selector supplies the RMS calibration before the voltage conversion;
raw DFT magnitudes are not implicitly volts. The existing −120 dBV display floor
becomes 0.001 mV. No electrical equations or amplitude conventions change.

Explicit `metricPrefix:'none'` is also valid and is recommended for transported,
JSON/structured-cloned or manually copied tables, whose private unit metadata
does not survive. Combining different x-axis units in one plot or requesting
another metric scale on a unit-selected table reports a clear error.

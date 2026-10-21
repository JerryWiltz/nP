<!-- Modified: 2026-10-21 -->
# Waveform in nPort

Before an FFT can describe a signal by frequency, it needs **samples**: values taken at known times. `nP.waveform()` is where nP evaluates a periodic voltage shape on a chosen time grid. It produces both the values for an FFT and time-voltage pairs for a chart.

For the sample-rate, Nyquist, and ADC-resolution choices behind that grid, start with [Sampling and quantization](./tech-notes-sampling-and-quantization.md).

## From a continuous shape to samples

Imagine a voltage `v(t)` that repeats every `T` seconds. A uniform time grid picks one value every `Δt` seconds:

```text
t[n] = t[0] + n Δt             n = 0, 1, ..., N − 1
sample[n] = v(t[n])
Fs = 1 / Δt                    samples per second
```

The shape and the grid answer different questions. The shape says what voltage to evaluate at a time; the grid says **when** to evaluate it. `N` determines how many values are returned. Reducing `Δt` takes more samples per second and can show a sharper edge in the sampled plot. The samples are still discrete, even when a chart draws a line between them.

For one period with `N` evenly spaced samples, use `Δt = T / N` and sample at `0, Δt, ..., (N − 1)Δt`. Do **not** include a second sample at `T`: a periodic shape has the same phase at `0` and `T`, so that point duplicates the start of the next period. `tGen(start, stop, points)` includes both endpoints, which is why the `stop` value below is `T × (N − 1) / N`.

Sampling does not prevent aliasing. Components above half the sample rate can appear at lower frequencies after sampling. Ideal square-wave edges and sharp trapezoid corners contain high-frequency content, so a finite sample rate cannot capture every detail. `waveform()` does not apply an anti-alias filter or warn about an undersampled shape.

## How nPort samples a waveform

Set `nP.global.tList` to at least two uniformly spaced, increasing times in seconds. `nP.waveform({period: T, shape: ...})` reads that grid by default. It evaluates the selected periodic shape at every time, wrapping times into the period, and returns a waveform object. You can pass `time: anotherTimeList` instead; if you later call `nP.FFT()`, set `global.tList` to that same grid because the FFT reads its time context there. `waveform()` itself changes neither `tList` nor `fList`.

The supported voltage shapes are:

| `shape` | Meaning | Defaults and controls |
| --- | --- | --- |
| `'triangle'` | Straight rise and fall within each period. | Default shape; `lowVolts: -1`, `highVolts: 1`, `riseFraction: 0.5`. |
| `'square'` | High level, then low level, with ideal transitions. | `lowVolts: -1`, `highVolts: 1`, `dutyCycle: 0.5`. |
| `'rectifiedSine'` | Absolute value of a sine with period `T` before rectification. | `lowVolts: 0`, `highVolts: 1`; the result repeats every `T/2`. |
| `'custom'` | Linear interpolation between supplied time-voltage points, repeated every period. | Requires `points` starting at time `0` and ending at `T`. |

`riseFraction` places the triangle peak within the period, and `dutyCycle` sets the fraction of a square-wave period spent high. Both must be strictly between 0 and 1. Custom `points` are pairs of seconds and volts in increasing time order; declaring `shape: 'custom'` is mandatory when passing them.

## Sample a trapezoid

This 1 ms trapezoid rises to 1 V, stays high, falls, and then stays at 0 V. Sixteen samples per period give `Δt = 62.5 µs` and `Fs = 16 kHz`. The chosen corner times align with this grid, so the plotted points include the corners.

```js
var g = nP.global;
var period = 1e-3;
var sampleCount = 16;
g.tList = g.tGen(0, period * (sampleCount - 1) / sampleCount, sampleCount);

var trapezoid = nP.waveform({
  shape: 'custom',
  period: period,
  points: [
    [0, 0],
    [0.125e-3, 1],
    [0.625e-3, 1],
    [0.75e-3, 0],
    [period, 0]
  ]
});

var waveformTable = trapezoid.out('waveform');
var sampleValues = trapezoid.out('samples');
var sampleRate = trapezoid.out('sample rate');

nP.log('Sample rate (Hz):');
nP.log(sampleRate);
nP.log('Sample values:');
nP.log(sampleValues);

nP.lineChart({
  inputTable: [waveformTable],
  title: 'Sampled trapezoid',
  metricPrefix: 'milli',
  xAxisTitle: 'Time (ms)',
  yAxisTitle: 'Voltage (V)',
  showPoints: true
});
```

The table has a header `['Time (s)', 'Voltage (V)']` and one row for each sample. `metricPrefix: 'milli'` changes only the chart's displayed time unit; the stored times remain seconds. The line between points is a chart display, while `sampleValues` contains only the 16 voltages. Set `sampleCount` to 256 using the same `tGen` expression to see a denser sample grid.

## Send the samples to an FFT

`trapezoid.out('samples')` returns a copy of the voltage array in time order. Pass it to `nP.FFT()` after choosing the same `global.tList`. The FFT receives values; it uses `tList` to determine their spacing and label its frequency bins. It then fills `global.fList`. A waveform chart does not change those samples or the FFT result.

Other waveform outputs are `out('time')`, `out('sample count')`, `out('sample rate')`, and `out('period')`. `out('waveform')` is the default. Continue with [FFT in nPort](./tech-notes-fft-in-nport.md) for the transform and its chart-ready frequency tables, or run the [trapezoid round trip](./repl.md#example-trapezoid-fft-round-trip) in the REPL.

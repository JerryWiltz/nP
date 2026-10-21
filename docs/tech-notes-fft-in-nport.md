<!-- Modified: 2026-10-21 -->
# FFT in nPort

An FFT answers a practical question: **which frequencies are present in a sequence of samples, and with what amplitude and phase?** It can analyze voltage, acceleration, sound pressure, or any other sampled quantity. The input values do not have to represent an RF signal. Their sample times determine what the frequency axis means.

For how nP creates voltage samples from a periodic shape, see [Waveform in nPort](./tech-notes-waveform-in-nport.md).

## From samples to frequency bins

Suppose a signal has `N` samples, taken `Δt` seconds apart. The sample rate is `Fs = 1 / Δt` samples per second. The discrete Fourier transform (DFT) compares the sequence with complex sinusoids that complete an integer number of cycles in the `N`-sample record:

```text
X[k] = sum from n = 0 to N − 1 of x[n] · exp(−j 2πkn / N)
```

Each `X[k]` is complex. Its magnitude describes the strength of that frequency component, and its angle describes the component's phase relative to the start of the record. The bin spacing is `Δf = Fs / N = 1 / (N Δt)`. The FFT computes the same DFT results with fewer operations; it does not choose a different set of frequencies.

There are `N` complex output bins for `N` input samples. For an even `N`, bin `0` is DC, bins `1` through `N/2 − 1` are positive frequencies, bin `N/2` is Nyquist (`Fs/2`), and the remaining bins represent negative frequencies. A real input has conjugate pairs at positive and negative frequencies, so its nonnegative half contains the independent information. Complex input need not have that symmetry.

The FFT only sees the samples it receives. Frequencies above Nyquist can alias into lower bins, and a component that does not complete an integer number of cycles in the record spreads across bins (spectral leakage). Neither effect is diagnosed or removed by nP's FFT. An inverse FFT can restore the sampled sequence while saying nothing about values between those sample times.

## How nPort implements it

Set `nP.global.tList` to one uniformly spaced time in **seconds** for each input value. Pass the values, in the same order, to `nP.FFT(samples)`. The argument is an array of finite numbers or `nP.complex()` values; the times are supplied separately by `tList`. `nP.FFT()` uses the spacing to label bins in hertz, returns `N` complex values, and replaces `nP.global.fList` with the `N` signed bin frequencies. `fList` may start empty; it is not an input to the transform.

The forward transform uses the DFT convention shown above without dividing by `N`. nP uses a radix-2 FFT for power-of-two lengths and Bluestein's algorithm for other lengths, so callers do not need to add padding just to satisfy the implementation. `nP.invFFT(fft)` applies the inverse transform and divides by `N`; the resulting complex samples should match the original samples within floating-point precision. When given an array returned by `nP.FFT()`, the inverse result retains that transform's time grid for `.out()`.

## A four-sample sine

Here the samples `[0, 1, 0, -1]` describe one cycle of a sine wave sampled every millisecond. The record duration is `N Δt = 4 ms`, so `Fs = 1000 Hz` and the bin spacing is `250 Hz`.

```js
var g = nP.global;
g.tList = g.tGen(0, 3e-3, 4);
g.fList = [];

var samples = [0, 1, 0, -1];
var fft = nP.FFT(samples);
var magnitudeTable = fft.out('magnitude');
var voltageTable = fft.out('dBV');
var recovered = nP.invFFT(fft);
var recoveredTable = recovered.out('real');

nP.log(magnitudeTable);
nP.log(recoveredTable);

nP.lineChart({
  inputTable: [voltageTable],
  title: 'Four-sample sine spectrum',
  plotType: 'bar',
  barBaseline: -80,
  yRange: [-80, 0],
  metricPrefix: 'none',
  xAxisTitle: 'Frequency (Hz)',
  yAxisTitle: 'Amplitude (dBV)'
});
```

The complete `fft` array and `g.fList` each have four entries. In bin order, the frequencies are `[0, 250, 500, -250]` Hz; the ideal complex results are `[0, -2j, 0, +2j]`. The two nonzero bins form a conjugate pair. `fft.out('magnitude')` shows only DC, 250 Hz, and Nyquist at 500 Hz; its 250 Hz magnitude is the **raw** value `2`. `recovered.out('real')` gives the four time-value pairs again, subject to tiny numerical rounding.

## Reading amplitudes

Raw FFT magnitudes are not yet one-sided RMS amplitudes. For **real voltage samples**, `fft.out('dBV')` converts each nonnegative bin to RMS volts, then to `20 log10(Vrms / 1 V)`. DC and Nyquist use `|X[k]| / N`; other positive bins use `√2 |X[k]| / N` to account for their negative-frequency partners. In the example, the 250 Hz bin is `√2 × 2 / 4 = 0.7071 Vrms`, or about `−3.01 dBV`.

The dBV table displays values below `−80 dBV` at that floor by default. Use `fft.out('dBV', {floorDbv: -100})` for another display floor. The dBV selector requires real voltage samples; for other quantities, use the raw magnitude or complex bins and apply the normalization and units appropriate to that measurement. `fft.out('real')`, `fft.out('imaginary')`, and `fft.out('magnitude')` also return chart tables for the nonnegative bins. Access the `fft` array itself when the full signed spectrum or complex phase is needed.

For a larger plotted example, open [Trapezoid, FFT, and inverse FFT](./repl.md#example-trapezoid-fft-round-trip) in the REPL. The [Math guide](./math.md#fourier-transforms) lists the transform API. Continue with [mod() in nPort](./tech-notes-mod-in-nport.md) for a signal that nP generates from digital data and prepares for an RF circuit.

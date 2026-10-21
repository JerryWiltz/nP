<!-- Modified: 2026-10-21 -->
# Sampling and quantization

Turning a changing voltage into digital data involves two separate choices: **when to measure it** and **how finely to represent each measured value**. The first sets the sample frequency. The second sets the converter's amplitude resolution, often described by its bit depth. An FFT uses the resulting sequence of values; it does not make either choice for the measurement system.

## Choose a sample frequency

Uniform sampling measures a signal every `Δt` seconds. The sample frequency, or sample rate, is `Fs = 1 / Δt` samples per second. A record of `N` samples spans `N / Fs` seconds of sample intervals, although its last stored time is only `(N − 1) / Fs` seconds after the first sample.

| Quantity | What it controls | Example with `Fs = 16 kHz`, `N = 16` |
| --- | --- | --- |
| Sample frequency `Fs` | Spacing between samples and the highest unaliased frequency. | `Δt = 62.5 µs`; Nyquist is `8 kHz`. |
| Sample count `N` | Number of values and record duration. | 16 values cover one 1 ms record. |
| FFT bin spacing `Fs / N` | Separation between frequency bins for that record. | `1 kHz` per bin. |

These controls are related but distinct. More samples **at the same sample rate** make a longer record and closer FFT bins. A higher sample rate **with the same sample count** gives a shorter record, a higher Nyquist frequency, and wider bin spacing.

## Nyquist and anti-alias filtering

For a signal whose frequency content is limited below `Fs / 2`, uniform samples can distinguish its frequencies in principle. `Fs / 2` is the Nyquist frequency. A component above it can masquerade as a lower-frequency component after sampling. For example, a 9 kHz sine sampled at 16 kHz produces samples at an apparent 7 kHz. An FFT of those samples cannot tell which frequency was present before sampling.

A physical acquisition system therefore uses an **analog anti-alias filter before its ADC** to reduce frequencies that the selected sample rate cannot represent. The filter needs room to roll off, so the useful signal band is normally kept below Nyquist. Increasing the sample rate also helps, but no finite rate captures every harmonic of an ideal square wave or an instantaneous edge. `nP.waveform()` evaluates its ideal shape directly at the chosen times; it does not model an analog anti-alias filter or detect aliasing.

## Choose an amplitude resolution

An ADC also assigns each measured voltage to one of a finite number of codes. An ideal **8-bit** ADC has `2^8 = 256` codes. If its input range is 0 to 1 V and those codes represent 256 equal input intervals, one interval is `1 V / 256 = 3.90625 mV` wide. With a midpoint value assigned to each interval, an in-range voltage can differ from its assigned value by at most half an interval: about `1.953125 mV`. A voltage outside the converter's input range clips at an end code. Actual converters also have noise and nonidealities.

Bit depth and sample frequency are independent. At 16,000 samples per second and 8 bits per sample, a single channel produces 128,000 raw bits per second before packaging or metadata. Increasing the bit depth makes smaller voltage steps; increasing the sample frequency takes measurements closer together in time. Quantization changes the sample values and can add spectral artifacts that an FFT will show.

**Eight bits per sample** is different from **eight samples per bit**. The latter is the default time density of some `nP.mod()` digital signals: each transmitted data bit is represented by eight voltage samples. It does not describe an 8-bit ADC or limit those samples to 256 amplitude codes. See [Digital signals](./digital-signals.md) for `samplesPerBit`.

## What nPort models

`nP.global.tList` holds sample times in seconds. The functions use the sampling ideas above in different ways:

| Function | Sample frequency and count | Nyquist and anti-aliasing | Bit depth and quantization |
| --- | --- | --- | --- |
| `nP.waveform()` | Evaluates the chosen voltage shape once per time in `global.tList` (or an explicit `time` list). The spacing sets `Fs`; the list length sets `N`. | Does not check the shape's bandwidth or apply an anti-alias filter. | Returns floating-point voltages; no ADC range, bit-depth setting, or quantization. |
| `nP.FFT()` | Requires one `global.tList` time per input sample. It uses `Fs = 1 / Δt` and `N` to label bins spaced `Fs / N` apart. | Cannot identify or undo aliasing already present in the samples. | Transforms the supplied values as they are; no ADC bit-depth setting. Quantization artifacts, if already in the samples, appear in the spectrum. |
| `nP.mod()` for sampled digital modes | Builds samples from bits. For the usual PN, ASCII, and raw-bit modes, `Fs = bitRate × samplesPerBit` and `N = bitCount × samplesPerBit`; the selected `tList` must match. | Some RF modes check that the carrier is below Nyquist; this is not a general anti-alias filter. | Voltage samples are floating-point values. `samplesPerBit` controls time density, not ADC bit depth. |

`mod()` also has tone-based analog modes and OFDM, which use different frequency and sample-count rules. See [Digital signals](./digital-signals.md) for their settings.

For a 16 kHz grid containing 16 samples of a 1 kHz square-wave period:

```js
var g = nP.global;
var sampleRateHz = 16e3;
var sampleCount = 16;
g.tList = g.tGen(0, (sampleCount - 1) / sampleRateHz, sampleCount);

var square = nP.waveform({
  shape: 'square',
  period: 1e-3
});

var samples = square.out('samples');
var actualRateHz = square.out('sample rate');

nP.log(actualRateHz); // 16000
nP.log(samples);      // 16 voltage values, with no ADC quantization
```

The grid ends at `0.9375 ms`, just before the next period begins. The 16 values are floating-point voltages of either +1 V or −1 V. No converter range or 8-bit code is implied. Continue with [Waveform in nPort](./tech-notes-waveform-in-nport.md) to see how a custom shape is sampled, [FFT in nPort](./tech-notes-fft-in-nport.md) to see how samples become frequency bins, and [mod() in nPort](./tech-notes-mod-in-nport.md) to see how nP prepares a sampled transmitter for a circuit.

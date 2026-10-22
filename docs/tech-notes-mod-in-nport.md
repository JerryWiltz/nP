<!-- Modified: 2026-10-21 -->
# mod() in nPort

Modulation turns information into a signal that can travel through a system. For digital data, each bit or group of bits selects a voltage level, a carrier amplitude, a carrier frequency, or a phase. The resulting signal can be viewed as **voltage versus time** or as **frequency components** that a circuit acts on. `nP.mod()` prepares both views for nP's digital signal workflow.

## From bits to sampled voltage

A bit rate `Rb` tells us how many data bits arrive each second. To represent each bit in a sampled signal, choose `samplesPerBit`. For the ordinary sampled bit modes:

```text
sample rate Fs = Rb × samplesPerBit
sample count N = bit count × samplesPerBit
Nyquist frequency = Fs / 2
FFT bin spacing = Fs / N
```

With 1 Mbit/s and eight samples per bit, each bit lasts 1 µs, the samples are 125 ns apart, and `Fs` is 8 MHz. Eight **samples per bit** controls time resolution; it does not mean an 8-bit ADC or 256 voltage levels. See [Sampling and quantization](./tech-notes-sampling-and-quantization.md) for that distinction.

At baseband, the samples can directly represent two voltage levels, such as 0 V and 1 V. An RF mode changes those samples according to a carrier: OOK and ASK change amplitude, FSK changes frequency, and PSK changes phase. The selected carrier and occupied tones must fit within the sample rate. This calculation does not add an analog anti-alias filter or ADC quantization.

## How nPort implements it

Set `nP.global.tList` to one uniformly spaced time in seconds for **every generated sample**, then call `nP.mod(options)`. For PN, ASCII, and raw-bit sources, `bitRate` and `samplesPerBit` determine the required count and spacing. The default source is PN7 at 1 Gbit/s with eight samples per bit; `carrierHz: 0` gives a baseband signal. `mod()` checks that the selected time list matches the generated signal.

For sampled digital modes, nP computes the signal's frequency components internally and fills `global.fList` with the nonnegative bins from DC through Nyquist. With an even `N`, that list has `N/2 + 1` frequencies. This differs from a direct `nP.FFT()` call, whose returned array and `global.fList` contain all `N` signed bins. `mod()` returns a **transmitter signal object**, not an n-port or a chart. Its `out('waveform')` and `out('frequency table')` methods provide display tables.

## A four-bit baseband example

The string `1010` contains four bits. At 1 Mbit/s and eight samples per bit, it produces 32 voltage samples at 8 MHz. The 32-sample record lasts 4 µs; its last stored time is 3.875 µs. The frequency list contains 17 bins from 0 to 4 MHz, spaced 250 kHz apart.

```js
var g = nP.global;
var bitRate = 1e6;
var samplesPerBit = 8;
var bitCount = 4;
var sampleRate = bitRate * samplesPerBit;
var sampleCount = bitCount * samplesPerBit;
g.tList = g.tGen(0, (sampleCount - 1) / sampleRate, sampleCount);
g.fList = [];

var tx = nP.mod({
  mode: 'bits',
  bits: '1010',
  bitRate: bitRate,
  samplesPerBit: samplesPerBit
});

var settings = tx.out('settings');
var waveformTable = tx.out('waveform');
var frequencyTable = tx.out('frequency table');

nP.log(settings);
nP.lineChart({
  inputTable: [waveformTable],
  title: 'Four transmitted bits',
  metricPrefix: 'none',
  xAxisTitle: 'Time (ns)',
  yAxisTitle: 'Voltage (V)'
});
nP.lineTable({
  inputTable: frequencyTable,
  title: 'Transmit frequency bins'
});
```

The first eight samples are 1 V, the next eight are 0 V, and so on. The waveform table's times are already in **nanoseconds**, so the chart uses `metricPrefix: 'none'`. `tx.out('settings')` reports the bit rate, samples per bit, sample rate, and counts. `tx.out('spectrum')` returns the nonnegative complex bins; they are raw transform values, not a dBV table.

## From transmitter to circuit

Call `mod()` **before** constructing frequency-dependent n-port components. They then use the frequencies it placed in `global.fList`. Attach the transmitter to a circuit with `{signal: tx}`, for example in `nP.cascade(attenuator, {signal: tx})`, and use `nP.demod()` on the completed circuit to examine the received data. If you supply `fftList: someArray`, `mod()` fills that array instead of replacing the selected context's `fList`; the circuit components must use the same frequency list.

`nP.mod({input: pn})` accepts a `nP.PN()` clocked pattern and expands each tick into the chosen samples per bit. It does not currently take the result of `nP.waveform()` as its `input`. RF modes such as OOK, ASK, FSK, PSK, QPSK, QAM, and OFDM have additional carrier and symbol settings. The analog AM, FM, PM, SSB, and DSB-SC modes use sparse tone frequencies rather than this bit-sample grid. See [Digital signals](./digital-signals.md) for the mode options and a complete transmitter–circuit–receiver example.

## VNA-style time-domain response

A vector network analyzer measures one frequency at a time. Its time-domain display is calculated from the complex frequency response; the analyzer does not need to launch the displayed impulse. `nP.mod({mode: 'VNA'})` follows that calculation: it places a unit reference at each nonnegative frequency bin from a power-of-two `tList`, with the Nyquist bin set to zero for a real inverse transform. The model evaluates DC directly, while a physical RF VNA commonly extrapolates it. The `fList` then drives an ordinary n-port circuit. `nP.demod(circuit, {noise: false}).out('waveform')` reconstructs the synthetic output impulse from the circuit's complex response. This mode has no bit rate, bit decisions, or RF carrier.

The frequency spacing sets the time window: `T = 1 / Δf`. The maximum frequency sets the approximate width of the calculated impulse. The example in [Digital signals](./digital-signals.md#vna-short-and-open-reflections) uses 4,096 time samples at 250 MHz, giving 2,049 nonnegative bins, a 16.384 µs time window, and about 61 kHz bin spacing. A short at the end of the ideal 1 km `Tlin()` produces a negative return after approximately 6.67 µs; an open produces a positive return. The [VNA time-domain reflection RF note](./tech-notes-vna-time-domain-reflection.md) derives the synthetic pulse and checks the travel time. A step response, alternative window, and custom pulse spectrum are future extensions.

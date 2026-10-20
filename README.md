<!-- Modified: 2026-10-19 -->
# nP

JavaScript tools for RF and microwave network analysis.

nP creates reusable n-port components, connects them into larger circuits, extracts S-parameter data, and renders line charts, SVG tables, and Smith charts. It runs in browsers and is distributed as ESM, CommonJS, and UMD bundles.

## Status

nP is under active development. The current source version is `0.0.48`, so APIs may continue to evolve before a stable release.

The npm package uses the `@jerrywiltz` scope so it does not conflict with the unrelated unscoped `np` package.

## Installation

```sh
npm install @jerrywiltz/np
```

## Quick start

Download [`dist/nP.js`](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js), place it beside your HTML file, and load it as a browser script. The UMD bundle exposes the global `nP` object.

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>nP RF analysis</title>
</head>
<body>
    <div id="chart"></div>
    <script src="./nP.js"></script>
    <script>
        nP.global.fList = nP.global.fGen(0.1e9, 6e9, 101);

        var r1 = nP.R(25);
        var l1 = nP.L(2e-9);
        var circuit = nP.nodal(
            [r1, 1, 2],
            [l1, 2, 3],
            ['out', 1, 3]
        );

        var response = circuit.out('s11dB', 's21dB');
        nP.lineChart({
            inputTable: [response],
            mount: '#chart',
            title: 'Series R-L response',
            metricPrefix: 'giga'
        });
    </script>
</body>
</html>
```

The normal workflow is:

1. Set the frequency list and other global analysis settings.
2. Create components as n-port objects.
3. Connect components with `nP.nodal()` or cascade two-ports with `nP.cascade()`.
4. Extract numeric results with `.out(...)`.
5. Display those results with a chart or table.

Constructors use the current `nP.global.fList` by default. `nP.global()` creates and selects a separate circuit context containing `fList`, `tList`, `twoTone`, `Ro`, and `Temp`; `nP.global(g)` selects a previously created context `g` again. Existing `nP.global.fList = ...` calls still set the selected context. You can also pass `{fList: frequencies}` to an individual component: `nP.R({resistance: 75, fList: frequencies})`, `nP.mlin({width: 23e-3, fList: frequencies})`, or `nP.Tee({fList: frequencies})`. Positional constructors accept a final options object, for example `nP.L(5e-9, {fList: frequencies})` or `nP.Amp(20, 4, 290, {fList: frequencies})`. All components combined in one circuit must use matching frequency rows. Existing components keep their own frequency lists when another context is selected.

## Module usage

The npm package exposes the same named API from ESM and CommonJS.

```js
// ESM
import * as nP from '@jerrywiltz/np';
```

```js
// CommonJS
const nP = require('@jerrywiltz/np');
```

Local bundle entry points are:

- `dist/nP.esm.js` — ES module
- `dist/nP.cjs` — CommonJS
- `dist/nP.js` — UMD browser bundle exposing `nP`

The math helpers also include `FFT()` and `invFFT()`. They accept a nonempty array of real numbers or `nP.complex()` values and return an array of complex values at the same length. The forward transform is unscaled; the inverse divides by the sample count. They work for arbitrary lengths, including the 768 samples in an eight-samples-per-bit, 96-bit ASCII message. They transform sample values only: with sample rate `Fs` and `N` samples, bin `k` is at `k * Fs / N` up to Nyquist; higher bins represent negative frequencies at `(k - N) * Fs / N`.

```js
var spectrum = nP.FFT([1, 0, 0, 0]);
var samples = nP.invFFT(spectrum);
var realSamples = samples.map(function (value) { return value.getR(); });
// spectrum: four complex values, each 1 + 0i
// realSamples: approximately [1, 0, 0, 0]
```

## Digital waveform through a circuit

`mod()` and `demod()` provide a digital signal path. With `carrierHz: 0` (the default for PN, ASCII, and raw bits), `mod()` produces a baseband signal. A positive carrier moves a sampled waveform into the RF band before its FFT. The receiver uses mode-specific detection with known timing; carrier and clock recovery are not implemented. Use `tx.out('settings')` to inspect the carrier, sample rate, frequency count, and mode settings. `tx.out('frequency count')` gives the number of FFT frequencies, and `tx.out('frequency table')` returns `[['Bin', 'Frequency (Hz)'], ...]` for inspection or `lineTable()`. Check the count before constructing components or running `nodal()` on a large grid. To compare BER, use `nP.bitErrorRate(tx, chain, {receptions: 100})`.

For a direct connection with no circuit, pass the transmitter to `demod()`:

```js
var tx = nP.mod({mode: 'ASCII', message: 'hello', carrierHz: 200e6});
var rx = nP.demod(tx);
nP.log(rx.out('ASCII text'));
```

`demod(tx)` uses an ideal matched connection internally, with the transmitter's frequency grid and reference impedance. It includes matched-source thermal noise by default, just like a `Thru()` connection; use `{noise: false}` for a clean signal. `demod(chain)` still reads the propagated signal from the completed nPort.

For separate digital circuits, create a context for each circuit and set its `fList` to `[]`. `mod()` fills the selected context's frequency list; construct the components afterward. The constructors continue to use their usual defaults.

```js
var g = nP.global();
g.fList = [];
var firstTx = nP.mod({mode: 'PN7'});
var firstStage = nP.Attn(3);
var firstCircuit = nP.cascade(firstStage, {signal: firstTx});

var h = nP.global();
h.fList = [];
var secondTx = nP.mod({mode: 'ASCII', message: 'hello'});
var secondStage = nP.Thru();
var secondCircuit = nP.cascade(secondStage, {signal: secondTx});

nP.global(g); // select the first circuit again before constructing more parts for it
```

For a digital block before modulation, `tGen(start, stop, points)` returns a uniformly spaced time list in seconds and includes both endpoints. Each entry in `tList` is a **clock tick** for `PN()`; its register advances once per entry. Select `stages` from 2 through 16; the maximal-length period is `2 ** stages - 1` ticks, and `tList` must contain a whole number of periods. Seven stages is the default. `mod()` creates the finer FFT sampling grid, with eight samples per bit by default. `PN().out('waveform')` returns a chart-ready table of the voltage at each clock tick. For PN3, use `g.tList = g.tGen(0, 6e-9, 7)` and `nP.PN({stages: 3, time: g.tList})`.

```js
var g = nP.global();
g.tList = g.tGen(0, 126e-9, 127); // 127 ticks, 1 ns apart
g.fList = [];

var pn = nP.PN({stages: 7, time: g.tList});
var tx = nP.mod({input: pn, carrierHz: 200e6});
var chain = nP.cascade(nP.Attn(3), {signal: tx});
var rx = nP.demod(chain);

nP.lineChart({inputTable: pn.out('waveform')});
nP.lineChart({inputTable: rx.out('carrier waveform')});
nP.lineChart({inputTable: rx.out('waveform')});
```

`mod({input: pn})` expands each PN bit to eight samples, applies the carrier when requested, transforms those samples, and fills `g.fList`. Use `mod({input: pn, samplesPerBit: 4})` to choose another FFT sampling density. The first clock tick is the FFT's zero-time reference; the PN period extends one clock interval beyond the last tick returned by `tGen()`. Direct shortcuts range from `mod({mode: 'PN2'})` through `mod({mode: 'PN16'})`; `PN7` remains the default. `mod().out('waveform')` returns its sampled transmit voltage. For a positive carrier, `demod().out('carrier waveform')` returns the received passband voltage, and `out('waveform')` returns the recovered bit levels. If `mod()` receives an explicit `fftList` array, it fills that array in place instead.

`mod()` returns a signal description with a repeating bit sequence, complex FFT spectrum, frequency list, and an `out()` method. Use `tx.out('mode')`, `tx.out('bit count')`, `tx.out('sample count')`, `tx.out('frequency count')`, `tx.out('frequencies')`, or `tx.out('spectrum')` to inspect it. It fills the selected context's `fList` unless you supply an `fftList` array. Construct components after modulation so their S-parameter rows match.

```js
var tx = nP.mod({mode: 'ASCII', message: 'hello, world', bitRate: 1e9, samplesPerBit: 8});
var thru = nP.Thru();
var chain = nP.nodal(
    [thru, 1, 2],
    ['out', 1, 2],
    {signal: tx, inputPort: 1}
);
var rx = nP.demod(chain);
nP.lineChart({inputTable: rx.out('waveform'), title: 'hello, world through Thru'});
```

The example's ASCII message produces 96 bits. The default mode is `PN7`, with a 127-bit period, 1 Gbit/s, eight samples per bit, and 0/1 V levels. Use `{mode: 'bits', bits: '0101'}` for an explicit bit string or array. Set `lowVolts`, `highVolts`, `bitRate`, or `samplesPerBit` in the same options object. The sequence repeats periodically for the FFT calculation. `demod(chain, {outputPort: 3})` selects another output on a multiport nPort; port 2 is the default. For two-port chains, use `nP.cascade(firstStage, secondStage, {signal: tx, inputPort: 1})`. The input port defaults to 1. Signal sources combined in one network need matching sample rates, sample counts, FFT frequency rows, and reference impedances.

`demod()` returns a receiver result with `.out('waveform')`, `.out('ASCII text')`, `.out('bits')`, `.out('bit count')`, `.out('sample count')`, `.out('frequency count')`, `.out('frequencies')`, and `.out('spectrum')`. It draws a new random noise waveform on every call, using the nPort's calculated source, termination, and component noise at each frequency. All outputs from the same receiver result use that same noise draw. The plotted `out('noiseFloor')` remains the repeatable average noise density. Use `{noise: false}` for an exact signal-only result.

`out('ASCII text')` uses the bit timing carried by `chain`, samples at each bit center, and estimates a threshold from the centers of the two received voltage levels. Pass `thresholdVolts` to `demod()` to set the decision level explicitly. A noisy bit can change the returned character; a received byte outside seven-bit ASCII becomes `�`. ASCII decoding needs complete eight-bit bytes and does not perform clock recovery or error correction. The default noise conditions are a matched 290 K source, matched terminations at 290 K, and a 0 K output load. The input port defaults to 1 and can be selected with `inputPort`.

The `referenceTemperature` option changes the source and unused-port termination noise temperature; pass the same option to `out('noiseFloor', {referenceTemperature: ...})` when comparing with the expected noise floor. Each reception draws new noise, so the received text can vary.

For a BER measurement, `nP.bitErrorRate(tx, chain, {receptions: 100})` compares the known transmitted bits with 100 independent receiver decisions and returns the fraction in error. The helper uses `demod()` by default. See [the attenuator example](dev/timeDomainDevelopment.html) for a 290 K, 17.6 dB stage near $10^{-2}$ BER.

### OOK and two-level ASK

Use `mode: 'OOK'` or `mode: 'ASK'` to name the carrier modulation explicitly. Both require a positive `carrierHz`. OOK defaults to 0 V for bit 0 and 1 V for bit 1; ASK defaults to 0.5 V and 1 V. `dataMode` selects the bits (`'PN2'` through `'PN16'`, `'ASCII'`, or `'bits'`) and defaults to `'PN7'`. If `message` or `bits` is supplied without `dataMode`, the data mode is inferred. A clocked `PN()` object can also be passed as `input`.

```js
var ook = nP.mod({mode: 'OOK', carrierHz: 200e6, message: 'Hi'});
var ask = nP.mod({mode: 'ASK', carrierHz: 200e6,
    dataMode: 'bits', bits: '0101', lowVolts: 0.25, highVolts: 1});

var chain = nP.cascade(nP.Attn(3), {signal: ask});
var rx = nP.demod(chain);
var bits = rx.out('bits');
var ber = nP.bitErrorRate(ask, chain, {receptions: 100});
```

`tx.out('mode')` reports `'OOK'` or `'ASK'`; `tx.out('settings').dataMode` reports the bit source. The completed nPort retains both fields, and `rx.out('mode')` and `rx.out('data mode')` report them after coherent reception. OOK requires `lowVolts: 0`; ASK requires `0 < lowVolts < highVolts`. Existing digital calls such as `mod({mode: 'ASCII', carrierHz: 200e6})` continue to work.

### Single-tone analog AM

For a sinusoidal modulation tone, `mod({mode: 'AM', ...})` creates exactly three complex peak-voltage tones: lower sideband, carrier, and upper sideband. It sets `fList` to those three frequencies without sampling the RF waveform or running an FFT. The modulation index defaults to 0.5, the carrier peak voltage defaults to 1 V, and the carrier and modulation frequencies are required.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'AM', carrierHz: 200e6, toneHz: 300,
    modulationIndex: 0.5, carrierAmplitudeVolts: 1});
var stage = nP.Attn(3);
var chain = nP.nodal(
    [stage, 1, 2],
    ['out', 1, 2],
    {signal: tx}
);
var tones = chain.out('signal2V', 'signal2Deg', 'signal2dBm');
var rx = nP.demod(chain);
var phaseSwingDeg = rx.out('amToPmDeg');
```

The three `chain.out()` rows are at `carrierHz - toneHz`, `carrierHz`, and `carrierHz + toneHz`. `signal2V` is peak voltage at port 2, `signal2Deg` is its phase, and `signal2dBm` is its power into the reference impedance. `rx.out('envelope')` and `rx.out('phase')` return tables over one modulation period; `amToPmDeg` is the largest absolute phase deviation from the output carrier phase on that table. This AM path is deterministic; random noise samples are not yet included in its envelope calculation. The existing digital modes and BER calculation continue to use sampled waveforms.

### Single-tone analog FM

For sinusoidal FM, supply `beta`, the modulation index. `mod()` creates the carrier and symmetric sidebands spaced by `toneHz`; it keeps enough sidebands that the omitted power fraction is at most `sidebandPowerTolerance` (default `1e-6`). It calculates the sideband coefficients from the modulation phase without sampling the RF carrier. The number of circuit frequencies grows with `beta`; inspect `tx.out('settings')` before constructing the circuit.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'FM', carrierHz: 200e6, toneHz: 300,
    beta: 5, carrierAmplitudeVolts: 1});
var stage = nP.Attn(3);
var chain = nP.nodal(
    [stage, 1, 2],
    ['out', 1, 2],
    {signal: tx}
);
var tones = chain.out('signal2V', 'signal2Deg', 'signal2dBm');
var rx = nP.demod(chain);
var deviation = rx.out('frequency deviation');
var peakDeviationHz = rx.out('peak frequency deviation Hz');
```

`beta` must be nonnegative; the unfiltered input's peak frequency deviation is `beta * toneHz`. `tx.out('settings')` reports `sidebandOrder` and `frequencyCount`, and `tx.out('tones')` lists the input phasors. `rx.out('envelope')`, `rx.out('phase')`, and `rx.out('frequency deviation')` return tables over one modulation period. The phase table wraps at ±180°. The default 1,001 display points can be changed with `demod(chain, {points: ...})`. FM reception here is deterministic; random receiver noise is not yet included.

### Single-tone analog PM

For PM, `beta` is the peak phase swing in **radians**. `mod()` uses a cosine phase waveform and includes enough sidebands to meet the same power tolerance as FM. For small beta, the first sidebands are approximately `beta / 2` times the carrier voltage. PM and FM use the same nPort connection path.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'PM', carrierHz: 200e6, toneHz: 300, beta: 0.1});
var stage = nP.Attn(3);
var chain = nP.cascade(stage, {signal: tx});
var tones = chain.out('signal2V', 'signal2Deg', 'signal2dBm');
var rx = nP.demod(chain);
var phase = rx.out('phase');
var peakPhaseRadians = rx.out('peak phase deviation radians');
```

`rx.out('phase')` is an unwrapped degree-valued table centered on the mean phase over one tone period. `rx.out('frequency deviation')` is also available; a sinusoidal PM tone has peak frequency deviation `beta * toneHz`. The recovered phase swing may differ after a frequency-selective circuit. `tx.out('settings')` includes `peakPhaseRadians`, `sidebandOrder`, and `frequencyCount`. PM reception is deterministic; `{noise: true}` is not yet supported.

### Binary FSK

FSK sends each 0 at `carrierHz - frequencyDeviationHz` and each 1 at `carrierHz + frequencyDeviationHz`. The phase remains continuous when bits change. By default, the deviation is half the bit rate; supply another positive `frequencyDeviationHz` when needed. Choose `samplesPerBit` so the sample rate exceeds twice the upper tone frequency.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'FSK', carrierHz: 200e6, bitRate: 10e6,
    samplesPerBit: 64, message: 'Hi'});
var stage = nP.Attn(3);
var chain = nP.cascade(stage, {signal: tx});
var rx = nP.demod(chain);
var text = rx.out('ASCII text');
var decisions = rx.out('tone energies');
```

`tx.out('settings')` reports both tones, the frequency deviation, and the frequency count before components are constructed. `demod()` compares energy at both tones in each bit interval; it needs bit timing from the signal metadata but no carrier phase reference. `rx.out('bits')`, `out('ASCII text')`, `out('tone energies')`, and `out('waveform')` are available. The ordinary digital receiver noise applies unless `{noise: false}` is supplied.

### Binary PSK

PSK keeps one carrier frequency and sends a 0 at 180° and a 1 at 0°. This is binary phase shift keying (BPSK); phase reverses at a bit transition. Reception correlates each bit with a zero-phase carrier and decides from the sign, so the receiver needs known carrier phase and bit timing. Carrier phase recovery is not implemented.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'PSK', carrierHz: 200e6, bitRate: 10e6,
    samplesPerBit: 64, message: 'Hi'});
var stage = nP.Attn(3);
var chain = nP.cascade(stage, {signal: tx});
var rx = nP.demod(chain);
var text = rx.out('ASCII text');
```

`carrierAmplitudeVolts` defaults to 1 V peak. `tx.out('settings')` reports the carrier, phase mapping, sample rate, and frequency count. `rx.out('bits')`, `out('ASCII text')`, `out('waveform')`, and `out('carrier waveform')` work as in the other sampled digital modes. Receiver noise is on by default; use `{noise: false}` for a deterministic check.

To use Manchester (bi-phase) coding on the PSK carrier, add `encoding: 'Manchester'`. A `1` sends 0° for the first half-bit and 180° for the second; a `0` reverses that order. Every bit therefore has a mid-bit phase reversal. Ordinary whole-bit PSK remains the default (`encoding: 'NRZ'`).

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'PSK', encoding: 'Manchester',
    carrierHz: 200e6, bitRate: 10e6, samplesPerBit: 64,
    message: 'Hi'});
var chain = nP.cascade(nP.Attn(3), {signal: tx});
var text = nP.demod(chain).out('ASCII text');
var spectrum = tx.out('spectrum');
```

`samplesPerBit` must be even. Equal, opposite phase halves suppress the carrier line in the ideal aligned-frequency case, including a run of identical bits. The receiver compares the two halves using the known carrier phase and bit timing; `rx.out('encoding')` reports `'Manchester'`. Carrier and clock recovery are not implemented.

### More modulation modes

The same `mod()` → components → `cascade()` or `nodal()` → `demod()` workflow supports these additional modes. Build each example in its own circuit context so the components use its frequency list.

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'QPSK', carrierHz: 200e6,
    symbolRate: 5e6, samplesPerBit: 64, message: 'Hi'});
var chain = nP.cascade(nP.Amp(20, 4), nP.Attn(3), {signal: tx});
var rx = nP.demod(chain);
nP.log(rx.out('ASCII text'));
```

Available sampled digital modes are binary `DPSK`, `QPSK`, square `QAM` (orders 4, 16, 64, or 256), `MSK`, Gaussian-filtered `GMSK`, and `OFDM`. They accept `message`, `bits`, or PN data. `DPSK` and `QAM` add a known reference symbol; `QPSK` and `QAM` use Gray-coded I/Q axes. Set `symbolRate` for QPSK/QAM or `bitRate`; when both are supplied, they must agree. MSK uses deviation `bitRate / 4`; GMSK defaults to `bt: 0.3`.

`OFDM` defaults to 64 data subcarriers, a 256-sample inverse FFT per symbol, 5 MHz subcarrier spacing, and QPSK per subcarrier. Its carrier must align to that spacing and keep all occupied tones between DC and Nyquist. `subcarrierMode: 'QAM'` with `order: 16` selects 16-QAM subcarriers. A known carrier pilot corrects one gain and phase per OFDM block. The receiver assumes known carrier and symbol timing and does not equalize each subcarrier separately.

Single-tone analog `SSB` and `DSB-SC` use only their occupied tone frequencies, with no RF waveform FFT:

```js
var ssb = nP.mod({mode: 'SSB', sideband: 'USB',
    carrierHz: 200e6, toneHz: 300, toneAmplitudeVolts: 1});
var suppressedAm = nP.mod({mode: 'DSB-SC',
    carrierHz: 200e6, toneHz: 300, toneAmplitudeVolts: 1});
```

Use `nP.demod(chain).out('waveform')` for the coherently recovered tone, or `.out('tones')` for its propagated frequency components. These analog paths are deterministic and do not synthesize receiver noise. See [modDemod.md](developmentDocs/modDemod.md) for all mode objects, FFT usage, and metadata.

## Circuit example

This low-pass network uses explicit electrical components so its topology remains visible:

```js
nP.global.fList = nP.global.fGen(50e6, 3e9, 101);

var tee = nP.Tee();
var short = nP.Short();
var l1 = nP.L(9.57e-9);
var c1 = nP.C(3.17e-12);

var lowPass = nP.nodal(
    [l1, 1, 2],
    [tee, 4, 2, 3],
    [c1, 4, 5],
    [short, 5],
    ['out', 1, 3]
);

var response = lowPass.out('s11dB', 's21dB');
```

Every S-parameter entry inside an n-port is a complex value. Common `.out()` selectors include:

- `s21mag` — magnitude
- `s21dB` — magnitude in decibels
- `s21ang` — angle in degrees
- `s21Re` — real part
- `s21Im` — imaginary part

## Noise

Every n-port carries frequency-aligned noise covariance as well as S-parameters. Use `.out()` for noise figure or individual covariance entries:

```js
var result = network.out('s21dB', 'NF21dB');
var floor = network.out('noiseFloor');
var thirdPort = threePort.out('NF31dB');
var thirdPortFloor = threePort.out('noiseFloor31dBmHz');
var covariance = network.out('c11', 'c22', 'c12Re');
```

`nP.Amp()` creates a matched, unilateral two-port with 20 dB gain, 4 dB minimum noise figure, zero optimum source reflection, 25 Ω noise resistance, and a 290 K reference temperature. `nP.Amp(12, 2.3)` changes the gain and minimum noise figure while retaining the other defaults; an optional third argument sets the reference temperature in kelvin. To change only named defaults, use an options object, such as `nP.Amp({fMinDb: 4.5})`. For a frequency-independent two-port with specified S-parameters and noise parameters, use:

```js
var amplifier = nP.Amp({
    spars: [
        nP.complex(0.1, 0.05), nP.complex(0, 0.01),
        nP.complex(9, 3), nP.complex(0.2, 0)
    ],
    fMinDb: 2,
    gammaOpt: nP.complex(0.2, 0.1),
    noiseResistanceOhms: 25,
    referenceTemperature: 290
});
```

The four `spars` entries are complex values in row-column order. `Amp()` calculates the two-port noise covariance and repeats these S and noise values at every analysis frequency. `noiseResistanceOhms` is in ohms relative to `nP.global.Ro`. In the object form, omitted fields retain their defaults; `s21` sets the matched gain when `spars` is supplied. An optional `noiseFigureDb` is checked against the matched-source value calculated from the noise parameters. Incompatible S and noise parameters are rejected rather than adjusted. For example, `nP.Amp({fMinDb: 7})` is incompatible with the default 25 Ω noise resistance; supply at least 50.15 Ω as well.

`NF31dB` means input at port 1 and output at port 3; `NF31` returns the linear noise factor. For ports numbered 10 or higher, use a separated selector such as `NF(10,1)dB`. The denominator is the output noise due to the selected source alone. Noise entering through other terminated ports counts toward the total output noise. By default the source is matched and at the 290 K noise-figure reference temperature. Other unused ports have matched 290 K terminations; the selected output has a matched, noiseless measurement load. Component temperatures remain those used to create their covariance.

`noiseFloor` is shorthand for output port 2 with source at port 1. It returns the total output noise in dBm/Hz, including the 290 K source and component noise. Use `noiseFloor31dBmHz` for output port 3 with source at port 1, or `noiseFloor(11,2)dBmHz` for larger port numbers. These selectors accept the same measurement options as NF and work on nPorts returned by `nodal()`, `cascade()`, or `cas()`. In the matched two-port case, the result equals the 290 K input noise density (about −174 dBm/Hz) plus `s21dB` plus `NF21dB`. It is a 1 Hz noise density; multiply by a specified noise bandwidth before reporting total noise power in dBm.

Specify measurement conditions with a final options object:

```js
var result = threePort.out('NF31dB', {
    referenceTemperature: 290,
    source: {reflection: nP.complex(0.2, 0.1)},
    terminations: {
        2: {reflection: nP.complex(0, 0), temperature: 320},
        3: {reflection: nP.complex(0, 0), temperature: 0}
    }
});
```

The source reflection must have magnitude less than 1; passive terminations may have magnitude up to 1. If a temperature is supplied for the selected output termination, its incident noise and backscatter are included in the result. This model assumes independent one-port terminations. Covariance selectors include `c11`/`c11Re` (real part), `c12Im`, `c11mag`, and `c11dB`. Active models need a full noise covariance for accurate results with source mismatch; one specified noise figure only defines the model at its stated source condition.

## Two-tone intermodulation

Set the swept first-tone frequencies and tone spacing **before** creating the components. Supply each tone's available input power in dBm. Phase defaults to zero degrees.

```js
nP.global.fList = [1e9];
nP.global.twoTone = {spacingHz: 1e8, p1dBm: -30, p2dBm: -25};

var amp = nP.Amp({gainDb: 20,
    oip2dBm: 42, harmonicOip2dBm: 40, oip3dBm: 30});
var attenuator = nP.Attn(3);
var chain = nP.nodal(
    [amp, 1, 2],
    [attenuator, 2, 3],
    ['out', 1, 3]
);

var result = chain.out('s21dB', 'IM2sum21dBm', 'H2f121dBm',
    'H2f221dBm', 'OIP2f121dBm', 'IM3lower21dBm');
```

`fList` contains the displayed first-tone frequencies. All built-in n-port constructors also create S and noise rows at the second tone, four IM product frequencies, and both second harmonics; `.out()` still returns one row per `fList` point. With the values above, these frequencies are 0.1, 0.9, 1.0, 1.1, 1.2, 2.0, 2.1, and 2.2 GHz. For a sweep from 1 to 2 GHz with 11 first-tone points and 1 MHz spacing, this gives 75 unique internal frequency rows and 11 output rows. Each sweep point is a separate two-tone experiment, even if its product frequency equals a frequency at another point. Custom nPorts must supply the same frequency rows to join the network.

The optional `oip2dBm` and `oip3dBm` values are output-referred, matched, equal-tone two-tone intercept specifications. `harmonicOip2dBm` is a separate, output-referred second-harmonic intercept for either input tone. Omitting one of these values means its corresponding products have zero generated power. No numerical relationship between two-tone and harmonic IP2 is assumed. The model generates products at the output of a matched, unilateral `Amp`; nonzero reflection or reverse-gain S-parameters with OIP inputs are rejected. Optional `im2PhaseDeg`, `harmonic2PhaseDeg`, and `im3PhaseDeg` adjust product phases. Input phases can be set with `phase1Deg` and `phase2Deg` in `global.twoTone`.

Selectors `IM2diff21dBm`, `IM2sum21dBm`, `IM3lower21dBm`, and `IM3upper21dBm` report output product power for input port 1 and output port 2. `H2f121dBm` and `H2f221dBm` report the harmonics at 2f₁ and 2f₂; `OIP2f121dBm` and `OIP2f221dBm` report their output-referred harmonic intercepts. Other `OIP...` selectors report two-tone intercepts. For another port pair, change the two port digits; for ports numbered 10 or higher, use parentheses such as `H2f1(10,1)dBm`. `nodal()`, `cascade()`, and `nPort.cas()` preserve known internal nonlinear sources through nested combinations. Linear passive constructors add no IP2/IP3 products of their own, but propagate each product through their S-parameters at that frequency. The calculation propagates generated waves once through the linear S-parameter network at each product frequency. It does not calculate compression, nonlinear remixing, or time averaging. When a product coincides with another product or a fundamental, the reported product power is their coherent combined power; an OIP selector for that frequency raises an error because the separate intercept cannot be recovered.

`nP.diode1N4148()` uses its DC bias point to generate one-pass IM2, IM3, and second-harmonic sources. The nonlinear source uses local current and junction-charge derivatives, so it is a weak-signal estimate around the selected bias, not a large-signal diode simulation or a datasheet-calibrated intercept model. Its noise behavior is described in the noise section above.

For a two-stage IP2 check, use the 15 dB A5 gain from Table 1 and its 40 dBm second-harmonic IP2 from Table 3 of Watkins-Johnson's [*Application Information for Thin Film Cascadable Amplifiers*](https://datasheet.datasheetarchive.com/originals/scans/Scans-068/DSA2IH00223110.pdf). The note says two-tone IP2 is approximately equal to second-harmonic IP2, so the 40 dBm `oip2dBm` inputs here are estimates. With matched stages and coherent IM2 addition, its general intercept rule gives 38.578 dBm for the cascade. The input tones may have different powers:

```js
nP.global.fList = [100e6];
nP.global.twoTone = {spacingHz: 1e6, p1dBm: -40, p2dBm: -35};

var firstA5 = nP.Amp({gainDb: 15, oip2dBm: 40});
var secondA5 = nP.Amp({gainDb: 15, oip2dBm: 40});
var twoA5s = nP.cascade(firstA5, secondA5);

var ip2Result = twoA5s.out('s21dB', 'IM2diff21dBm', 'IM2sum21dBm',
    'OIP2diff21dBm', 'OIP2sum21dBm');
// At 100 MHz: gain 30 dB; both IM2 products -53.578 dBm;
// both output IP2 values 38.578 dBm.
```

## Physical models

Physical transmission-media constructors use options objects with SI units and full engineering names. New code should use `resistivity` in ohm-meters; legacy `rho` aliases remain available for compatibility.

```js
var line = nP.mlin({
    width: 0.5842e-3,
    height: 0.635e-3,
    length: 12.7e-3,
    thickness: 25.4e-6,
    relativePermittivity: 10,
    resistivity: 1.72e-8,
    lossTangent: 0.001,
    roughnessRms: 0
});
```

Current microstrip constructors include:

- `mlin()` — transmission line
- `mclin()` — coupled transmission line
- `mtee()` — three-port tee
- `mstep()` — width step
- `mbend()` — bend
- `mcross()` — four-port cross
- `mtfr()` — thin-film resistor
- `mvgnd()` — grounded via
- `mvia()` — via transition

`mlin()`, `mclin()`, and `mtee()` accept no arguments for their defaults or one options object for custom values. Positional calls are no longer supported. Convert each old argument to its named property; for example, `mlin(width, height, length)` becomes `mlin({width, height, length})`. Use SI units and absolute `resistivity` in ohm-meters. Earlier property aliases inside an options object remain supported.

## Main API

| Area | API |
| --- | --- |
| Analysis settings | `nP.global`, `fGen()`, `tGen()` |
| Lumped components | `R()`, `L()`, `C()` |
| Ideal fixtures | `Open()`, `Short()`, `Load()`, `Thru()`, `Tee()`, `Tee4()`, `Tee5()`, `seriesTee()` |
| Ideal transmission lines | `Tlin()`, `Tclin()` |
| Network assembly | `nodal()`, `cascade()`, `nPort.cas()` |
| Data extraction | `nPort.out()` |
| Digital waveforms | `PN()`, `mod()`, `demod()`, `bitErrorRate()` |
| Mathematics | `complex()`, `matrix()`, `dim()`, `dup()`, `FFT()`, `invFFT()` |
| Filter prototypes | `chebyLPNsec()`, `chebyLPgk()`, `chebyLPLCs()` |
| Visualization | `lineChart()`, `lineTable()`, `smithChart()`, `log()` |
| Nonlinear devices | `diode1N4148()` |

The older combined RLC constructors remain available for compatibility, but new examples favor explicit components and `nP.nodal()`.

`nP.log(value)` displays text or a simple table on the page. Use `nP.log(value, {mount: '#results'})` to choose a destination; without `mount`, it uses the first `.outputBox` or the document body. It returns the created `<pre>` element. Text is displayed literally, including any HTML markup characters.

## Port conventions

Coupled transmission lines are numbered clockwise:

```text
port 1  ---- coupled line ----  port 2
port 4  ---- coupled line ----  port 3
```

With an input at port 1, port 2 is through, port 4 is coupled, and port 3 is isolated.

For `mtee()`, port 1 is the common arm and ports 2 and 3 are the branches:

```text
          port 2
            |
port 1 -----+
            |
          port 3
```

## Documentation

- [`docs/`](docs/) contains the user documentation site.
- [`developmentDocs/`](developmentDocs/) contains model provenance, equation notes, API decisions, and verification guidance.
- [`dev/`](dev/) contains standalone browser development harnesses and focused Obsidian `npjs` examples.
- [`docs/circuit-examples.md`](docs/circuit-examples.md) shows complete RF networks; the [API pages](docs/global-settings.md) document the current functions and defaults.

The related **nP RF Analysis** Obsidian plugin executes nP examples inside Markdown notes. It is maintained in a separate repository and consumes its own bundled copy of nP.

## Development

Requirements: a current Node.js release and npm.

```sh
git clone https://github.com/JerryWiltz/nP.git
cd nP
npm install
npm test
npm run build
```

Additional commands:

```sh
npm run docs:dev
npm run docs:build
npm run build:plugin
```

The source entry point is `src/index.js`. Rollup builds the distributable files under `dist/`.

`npm run build:plugin` creates the host-safe `dist/nP.plugin.esm.js` bundle for an intentional update of the separately maintained Obsidian plugin. That bundle is not included in the npm package.

## License

[MIT](LICENSE) © Jerry Wiltz

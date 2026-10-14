<!-- Modified: 2026-10-14 -->
# nP constructor catalog

This catalog covers the 51 public functions that produce n-port objects from `src/np-nport/src/index.js`, the digital waveform functions from `src/np-digital`, and the exported math and low-pass prototype functions. Each JS call below spells out the **current defaults** where they exist. Each argument or property appears on its own line. Units are in comments. Each constructor has its own heading and code block.

Parameter spelling follows the public API. Legacy positional names such as `R`, `N`, `Z`, and `Length` retain their source capitalization; physical options use `lowerCamelCase` property names. Positional argument order matters. Named object properties follow one presentation order: geometry, material and loss, then temperature.

Set the analysis frequencies before constructing components. The shared defaults are:

```js
// Shared analysis defaults and length units
nP.global.fList = [2e9]; // Hz
nP.global.tList = [];    // s; time samples for digital sources
nP.global.Ro = 50;       // Ω
nP.global.Temp = 293;    // K

const mil = 25.4e-6;     // m; used in the examples below
const inch = 0.0254;     // m
```

If `nP.global.twoTone` is set, constructors also create S and noise rows at the required product frequencies.

Frequency lists may include 0 Hz for digital waveform analysis. Ideal RLC branches use their exact DC circuit limits: a series capacitor opens, a shunt inductor shorts, and a series inductor or shunt capacitor becomes a through connection. Composite branches preserve any resistor that remains in the DC path. `mstep()` and `mbend()` become through connections, and `mcross()` becomes an ideal four-port junction. Their singular impedance or admittance metadata at 0 Hz is recorded as `null`. `mcross()` also uses that junction limit just above DC while its parasitic effects are below one part per million; the full admittance reduction loses precision there. The current `mlin()` and `mclin()` models produce lossless DC transmission even with finite conductor resistivity; they need a separate DC resistance model before their 0 Hz insertion loss can be treated as physical. `Shift90()` remains a frequency-independent phase fixture and should not be used as a physical DC path in a real-waveform analysis.

Every n-port constructor uses `nP.global.fList` by default. For an independent frequency grid, pass `{fList: frequencies}`. Constructors that already take an options object accept `fList` in that object. Positional constructors accept it in a final options object after their existing arguments. No-argument fixtures accept the options object as their first argument. `lpfGen()` accepts it after the filter array. The default for every optional `fList` is the current `nP.global.fList` when the component is created.

```js
var frequencies = [1e9, 1.5e9, 2e9];
var resistor = nP.R({resistance: 75, fList: frequencies});
var inductor = nP.L(5e-9, {fList: frequencies});
var amplifier = nP.Amp({gainDb: 20, fList: frequencies});
var attenuator = nP.Attn(3, nP.global.Temp, {fList: frequencies});
var junction = nP.Tee({fList: frequencies});
var line = nP.mlin({width: 23 * mil, fList: frequencies});
var filter = nP.lpfGen(undefined, {fList: frequencies});
```

Each nPort stores a copy of its selected frequency list and analysis settings. Components in one `nodal()` or `cascade()` circuit must have matching frequency rows. Call `nP.global()` to create and select an independent circuit context. It holds its own `fList`, `tList`, `twoTone`, `Ro`, and `Temp`; `nP.global(g)` selects an earlier context `g` again. Existing `nP.global.fList` and related property calls use the selected context. `nP.global.tGen(start, stop, points)` returns a uniformly spaced time list in seconds, including both endpoints. Two-tone analysis still requires positive first-tone frequencies and a positive spacing.

## Lumped components

Positional arguments are JavaScript numbers. `R`, `L`, and `C` are the preferred series two-port names; `se` and `pa` expand to series and parallel.

### `R`

```js
// R: Resistor
nP.R(
    75,             // R: resistance, Ω
    nP.global.Temp  // temperature: K
);
// returns an nPort object

nP.R({
    resistance: 75,             // Ω
    temperature: nP.global.Temp // K
});
// returns an nPort object
```

### `seR`

```js
// seR: series Resistor
nP.seR(
    75,             // R: resistance, Ω
    nP.global.Temp  // temperature: K
);
// returns an nPort object

nP.seR({
    resistance: 75,             // Ω
    temperature: nP.global.Temp // K
});
// returns an nPort object
```

### `paR`

```js
// paR: parallel Resistor
nP.paR(
    75,             // R: resistance, Ω
    nP.global.Temp  // temperature: K
);
// returns an nPort object

nP.paR({
    resistance: 75,             // Ω
    temperature: nP.global.Temp // K
});
// returns an nPort object
```

### `L`

```js
// L: Inductor
nP.L(
    5e-9 // L: inductance, H
);
// returns an nPort object
```

### `seL`

```js
// seL: series Inductor
nP.seL(
    5e-9 // L: inductance, H
);
// returns an nPort object
```

### `paL`

```js
// paL: parallel Inductor
nP.paL(
    5e-9 // L: inductance, H
);
// returns an nPort object
```

### `C`

```js
// C: Capacitor
nP.C(
    1e-12 // C: capacitance, F
);
// returns an nPort object
```

### `seC`

```js
// seC: series Capacitor
nP.seC(
    1e-12 // C: capacitance, F
);
// returns an nPort object
```

### `paC`

```js
// paC: parallel Capacitor
nP.paC(
    1e-12 // C: capacitance, F
);
// returns an nPort object
```

### `seSeRL`

```js
// seSeRL: series Series Resistor Inductor
nP.seSeRL(
    75, // R: resistance, Ω
    5e-9  // L: inductance, H
);
// returns an nPort object
```

### `sePaRL`

```js
// sePaRL: series Parallel Resistor Inductor
nP.sePaRL(
    75, // R: resistance, Ω
    5e-9  // L: inductance, H
);
// returns an nPort object
```

### `paSeRL`

```js
// paSeRL: parallel Series Resistor Inductor
nP.paSeRL(
    75, // R: resistance, Ω
    5e-9  // L: inductance, H
);
// returns an nPort object
```

### `paPaRL`

```js
// paPaRL: parallel Parallel Resistor Inductor
nP.paPaRL(
    75, // R: resistance, Ω
    5e-9  // L: inductance, H
);
// returns an nPort object
```

### `seSeRC`

```js
// seSeRC: series Series Resistor Capacitor
nP.seSeRC(
    75, // R: resistance, Ω
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `sePaRC`

```js
// sePaRC: series Parallel Resistor Capacitor
nP.sePaRC(
    75, // R: resistance, Ω
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paSeRC`

```js
// paSeRC: parallel Series Resistor Capacitor
nP.paSeRC(
    75, // R: resistance, Ω
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paPaRC`

```js
// paPaRC: parallel Parallel Resistor Capacitor
nP.paPaRC(
    75, // R: resistance, Ω
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `seSeLC`

```js
// seSeLC: series Series Inductor Capacitor
nP.seSeLC(
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `sePaLC`

```js
// sePaLC: series Parallel Inductor Capacitor
nP.sePaLC(
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paSeLC`

```js
// paSeLC: parallel Series Inductor Capacitor
nP.paSeLC(
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paPaLC`

```js
// paPaLC: parallel Parallel Inductor Capacitor
nP.paPaLC(
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `seSeRLC`

```js
// seSeRLC: series Series Resistor Inductor Capacitor
nP.seSeRLC(
    75, // R: resistance, Ω
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `sePaRLC`

```js
// sePaRLC: series Parallel Resistor Inductor Capacitor
nP.sePaRLC(
    75, // R: resistance, Ω
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paSeRLC`

```js
// paSeRLC: parallel Series Resistor Inductor Capacitor
nP.paSeRLC(
    75, // R: resistance, Ω
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

### `paPaRLC`

```js
// paPaRLC: parallel Parallel Resistor Inductor Capacitor
nP.paPaRLC(
    75, // R: resistance, Ω
    5e-9, // L: inductance, H
    1e-12  // C: capacitance, F
);
// returns an nPort object
```

The combined RLC constructors capture `nP.global.Temp` for passive noise; they have no temperature argument. They are older convenience models. Use separate parts with `nP.nodal()` when the circuit topology should be visible.

### `trf`

```js
// trf: transformer
nP.trf(
    0.5 // N: turns ratio, dimensionless
);
// returns an nPort object
```

### `trf4Port`

```js
// trf4Port: transformer 4 Port
nP.trf4Port(
    0.5 // N: turns ratio, dimensionless
);
// returns an nPort object
```

## Ideal components and fixtures

The following constructors use no arguments for defaults; each also accepts an optional `{fList}` object.

### `Open`

```js
// Open: Open
nP.Open();
// returns an nPort object
```

### `Short`

```js
// Short: Short
nP.Short();
// returns an nPort object
```

### `Thru`

```js
// Thru: Through connection
nP.Thru();
// returns an nPort object
```

`Thru()` is an ideal matched, lossless two-port with `s11 = s22 = 0` and `s12 = s21 = 1`, including at 0 Hz.

### `Load`

```js
// Load: Load
nP.Load();
// returns an nPort object
```

### `Shift90`

```js
// Shift90: Shift 90
nP.Shift90();
// returns an nPort object
```

### `Tee`

```js
// Tee: Tee
nP.Tee();
// returns an nPort object
```

### `Tee4`

```js
// Tee4: Tee 4
nP.Tee4();
// returns an nPort object
```

### `Tee5`

```js
// Tee5: Tee 5
nP.Tee5();
// returns an nPort object
```

### `seriesTee`

```js
// seriesTee: series Tee
nP.seriesTee();
// returns an nPort object
```

### `Tlin`

```js
// Tlin: Transmission line
nP.Tlin(
    60,         // Z: characteristic impedance, Ω
    0.5 * inch  // Length: m
);
// returns an nPort object
```

### `Tclin`

```js
// Tclin: Transmission coupled line
nP.Tclin(
    100,        // Zoe: even-mode impedance, Ω
    30,         // Zoo: odd-mode impedance, Ω
    1.47 * inch // Length: m
);
// returns an nPort object
```

`Tclin` has four ports. Coupled-line ports run clockwise from the upper left. `Tee4` has four ports and `Tee5` has five.

### `Attn`

```js
// Attn: Attenuator
nP.Attn(
    3,             // attenuationDb: dB
    nP.global.Temp // temperature: K
);
// returns an nPort object

// Equivalent object form:
nP.Attn({
    attenuationDb: 3,             // dB
    temperature: nP.global.Temp   // K
});
// returns an nPort object
```

### `Amp`

The positional form is a matched, unilateral amplifier:

```js
// Amp: Amplifier
nP.Amp(
    20, // gainDb: dB
    4,  // noiseFigureDb: dB
    290 // referenceTemperature: K
);
// returns an nPort object
```

`Amp()` is equivalent to `Amp(20, 4)`. The object form is frequency flat and has these defaults:

```js
// Amp: Amplifier
nP.Amp({
    spars: [
        nP.complex(0, 0),  // s11
        nP.complex(0, 0),  // s12
        nP.complex(10, 0), // s21: 20 dB matched gain
        nP.complex(0, 0)   // s22
    ],
    fMinDb: 4,                    // dB
    gammaOpt: nP.complex(0, 0),  // complex reflection coefficient
    noiseResistanceOhms: 25,     // Ω
    referenceTemperature: 290,   // K
    im2PhaseDeg: 0,              // degrees
    harmonic2PhaseDeg: 0,        // degrees
    im3PhaseDeg: 0               // degrees
});
// returns an nPort object
```

The object form also accepts these **optional** properties. Each is omitted by default:

```js
// Amp: Amplifier
nP.Amp({
    gainDb: 20,            // dB; use instead of spars
    noiseFigureDb: 4,     // dB; sets fMinDb if fMinDb is absent; checked against the noise model
    oip2dBm: 42,          // dBm; two-tone IM2 source
    harmonicOip2dBm: 40, // dBm; second-harmonic source
    oip3dBm: 30           // dBm; IM3 source
});
// returns an nPort object
```

That last call is an **example with OIP values**, not a default call. If an OIP property is omitted, that product is not generated. `gainDb` and `spars` cannot both be supplied. The four `spars` entries are complex values in row-major order. The noise inputs must yield a valid covariance; changing only `fMinDb` can conflict with the default `noiseResistanceOhms`. OIP calibration currently requires matched, unilateral S-parameters and positive real `s21`.

## Physical microstrip components

Each physical microstrip constructor accepts no arguments for defaults or one options object. **Every property below is a JavaScript number**, with physical lengths in meters. Shared geometry is listed as widths or spacing, then height, length where applicable, and thickness. Material, loss, and temperature inputs follow. Positional values are rejected. The legacy `rho` object property is a dimensionless multiplier of copper resistivity (`1.72e-8 Ω·m`) in the line, coupled-line, tee, step, bend, and cross models. The old via-model `rho` alias already has units of Ω·m. New calls should use absolute `resistivity`.

### `mlin`

```js
// mlin: microstrip line
nP.mlin({
    width: 23 * mil,               // m
    height: 25 * mil,              // m
    length: 0.5 * inch,            // m
    thickness: 0.0000125 * inch,   // m
    relativePermittivity: 10,     // dimensionless
    resistivity: 1.72e-8,         // Ω·m
    lossTangent: 0.001,           // dimensionless
    roughnessRms: 0,              // m
    temperature: nP.global.Temp   // K
});
// returns an nPort object
```

### `mclin`

```js
// mclin: microstrip coupled line
nP.mclin({
    width: 19.1155 * mil,         // m
    spacing: 5.82185 * mil,      // m
    height: 25 * mil,            // m
    length: 719.794 * mil,       // m
    thickness: 0.0000125 * inch, // m
    relativePermittivity: 10,   // dimensionless
    resistivity: 1.72e-8,       // Ω·m
    lossTangent: 0.001,         // dimensionless
    roughnessRms: 0,            // m
    temperature: nP.global.Temp // K
});
// returns an nPort object
```

### `mtee`

```js
// mtee: microstrip tee
nP.mtee({
    commonWidth: 23 * mil,        // m, port 1
    branch1Width: 23 * mil,       // m, port 2
    branch2Width: 23 * mil,       // m, port 3
    height: 25 * mil,            // m
    thickness: 0.0000125 * inch, // m
    relativePermittivity: 10,   // dimensionless
    resistivity: 1.72e-8,       // Ω·m
    lossTangent: 0.001,         // dimensionless
    roughnessRms: 0,            // m
    temperature: nP.global.Temp // K
});
// returns an nPort object
```

### `mstep`

```js
// mstep: microstrip step
nP.mstep({
    inputWidth: 46 * mil,          // m
    outputWidth: 23 * mil,         // m
    height: 25 * mil,             // m
    thickness: 0.0000125 * inch,  // m
    relativePermittivity: 10,    // dimensionless
    resistivity: 1.72e-8,        // Ω·m
    lossTangent: 0.001,          // dimensionless
    roughnessRms: 0              // m
});
// returns an nPort object
```

### `mbend`

```js
// mbend: microstrip bend
nP.mbend({
    width: 23 * mil,              // m
    // miterLength: 0,            // m; omitted by default, effective value 0
    height: 25 * mil,             // m
    thickness: 0.0000125 * inch,  // m
    relativePermittivity: 10,    // dimensionless
    resistivity: 1.72e-8,        // Ω·m
    lossTangent: 0.001,          // dimensionless
    roughnessRms: 0              // m
});
// returns an nPort object
```

### `mcross`

```js
// mcross: microstrip cross
nP.mcross({
    leftWidth: 23 * mil,          // m
    topWidth: 23 * mil,           // m
    rightWidth: 23 * mil,         // m
    bottomWidth: 23 * mil,        // m
    height: 25 * mil,            // m
    thickness: 0.0000125 * inch, // m
    relativePermittivity: 10,   // dimensionless
    resistivity: 1.72e-8,       // Ω·m
    lossTangent: 0.001,         // dimensionless
    roughnessRms: 0             // m
});
// returns an nPort object
```

### `mtfr`

```js
// mtfr: microstrip thin film resistor
nP.mtfr({
    ohmsPerSquare: 50,            // Ω/□
    width: 10 * mil,              // m
    height: 25 * mil,             // m
    length: 10 * mil,             // m
    thickness: 0.0000125 * inch,  // m
    relativePermittivity: 10,    // dimensionless
    lossTangent: 0.001,          // dimensionless
    temperatureCoefficient: 0,  // K⁻¹
    referenceTemperature: 298.15, // K
    // sections: 10              // optional positive integer; 10 for default geometry
});
// returns an nPort object
```

`mtfr` uses `nP.global.Temp` as its operating temperature. If `sections` is omitted, it is calculated from `length/width`. The legacy `temperatureReference` option has a different temperature scale; prefer `referenceTemperature`.

### `mvgnd`

```js
// mvgnd: microstrip via ground
nP.mvgnd({
    diameter: 100e-6,            // m
    height: 25 * mil,            // m
    thickness: 0.0000125 * inch, // m
    resistivity: 1.72e-8        // Ω·m
});
// returns an nPort object
```

### `mvia`

```js
// mvia: microstrip via
nP.mvia({
    diameter: 100e-6,            // m
    connectionHeight: 25 * mil,  // m
    thickness: 0.0000125 * inch, // m
    padDiameter: 0,             // m
    antipadDiameter: 0,         // m
    topPadHeight: 0,            // m
    bottomPadHeight: 0,         // m
    topStubLength: 0,           // m
    bottomStubLength: 0,        // m
    relativePermittivity: 10,  // dimensionless
    resistivity: 1.72e-8       // Ω·m
});
// returns an nPort object
```

Every physical microstrip options object also accepts `fList`, an array of frequencies in hertz, defaulting to `nP.global.fList`. For the physical object forms, use `resistivity` in Ω·m. Legacy `rho` defaults to **1** as a copper multiplier for `mlin`, `mclin`, `mtee`, `mstep`, `mbend`, and `mcross`; for `mvia` and `mvgnd` it defaults to **`1.72e-8 Ω·m`**. Do not supply `rho` and `resistivity` together. Other legacy property aliases are described in `developmentDocs/physical-model-api.md`.

## Diode

`diode1N4148` takes one options object. Its scalar properties are JavaScript numbers; `ivPoints` is an integer. It also accepts `fList`, an array of frequencies in hertz, defaulting to `nP.global.fList`.

### `diode1N4148`

```js
// diode1N4148: diode 1N4148
nP.diode1N4148({
    is: 2.75e-11,              // A, saturation current
    n: 2,                     // dimensionless ideality factor
    rs: 0.568,                // Ω, series resistance
    cj0: 4e-12,               // F, zero-bias junction capacitance
    vj: 0.75,                 // V, junction potential
    m: 0.5,                   // dimensionless capacitance exponent
    tt: 4e-9,                // s, transit time
    leakageResistance: 4e9,  // Ω
    breakdownVoltage: 100,   // V
    breakdownCurrent: 100e-6, // A
    breakdownSoftness: 2,    // V
    biasVoltage: 0,          // V, applied DC bias
    temperatureK: nP.global.Temp, // K
    ivStart: -110,           // V, first displayed DC sweep point
    ivStop: 1,               // V, last displayed DC sweep point
    ivPoints: 401            // number of DC sweep points
});
// returns an nPort object
```

The returned diode is a two-port with RF S-parameters, noise covariance, weak-signal nonlinear sources, and a DC I–V table.

## Digital waveform functions

### `PN`

```js
// PN: Pseudorandom Noise sequence driven by clock ticks
var g = nP.global();
g.tList = g.tGen(0, 126e-9, 127); // s; 127 clock ticks, 1 ns apart
g.fList = [];
var pn = nP.PN({
    stages: 7, // integer from 2 through 16; defaults to 7
    time: g.tList,
    seed: 0x7f,
    lowVolts: 0,
    highVolts: 1
});
var tx = nP.mod({input: pn});
// PN returns one bit per clock tick; mod samples the waveform for its FFT
```

`PN()` supports 2 through 16 stages, with a maximal-length period of `2 ** stages - 1` bits. Seven stages and the all-ones seed are defaults. Each entry in `time` clocks the shift register once, so a PN3 period needs 7 ticks and a PN7 period needs 127. `time` defaults to the selected context's `tList`; it must be uniformly spaced, increasing, and contain a whole number of periods. The time spacing determines bit rate. The PN period extends one clock interval beyond the last tick. `pn.out('bits')`, `pn.out('samples')`, and `pn.out('time')` return copies; each sample is the output voltage at a clock tick. `pn.out('waveform')` returns a chart-ready table in nanoseconds and volts. Other selectors are `bit count`, `sample count`, `bit rate`, `clock rate`, and `sample rate`. The PN object is a digital waveform, not an nPort; pass it to `mod({input: pn})` before constructing frequency-dependent components. `mod()` creates eight FFT samples per bit by default, or uses its optional `samplesPerBit` setting.

For PN3, set `g.tList = g.tGen(0, 6e-9, 7)`, then use `var pn = nP.PN({stages: 3, time: g.tList})` and `var tx = nP.mod({input: pn})`. The shorter direct form is `nP.mod({mode: 'PN3'})`; direct modes run from `PN2` through `PN16`.

### `mod`

```js
// mod: Modulator; baseband or real cosine carrier
var tx = nP.mod({
    mode: 'PN7',      // 'PN2' through 'PN16', 'ASCII', or 'bits'; defaults to 'PN7'
    carrierHz: 0,    // Hz; zero for baseband, positive below sample Nyquist
    bitRate: 1e9,    // bits per second
    samplesPerBit: 8,// positive integer
    lowVolts: 0,     // voltage for bit 0
    highVolts: 1     // voltage for bit 1
});
// returns a signal description with an out() method, not an nPort object
```

`mod()` accepts no arguments for its defaults. For ASCII, supply `message`; for a custom bit sequence, use `mode: 'bits'` and `bits`. To transform a waveform from `PN()`, use `{input: pn}` with an optional `samplesPerBit`; the clock spacing determines bit rate. With no `fftList`, it sets the selected context's `fList`. At `carrierHz: 0`, it produces a baseband spectrum. At a positive carrier below sample Nyquist, it multiplies the sampled voltage by a cosine before its FFT. `tx.out('settings')` reports the selected mode, carrier, bit rate, sample rate, sample and frequency counts, samples per bit, and voltage levels. `tx.out('waveform')` returns the sampled transmit voltage in a chart-ready table. `tx.out('frequency table')` returns `[['Bin', 'Frequency (Hz)'], ...]`, with one row per FFT frequency, including DC. Check `tx.out('frequency count')` before constructing components or running `nodal()` on a large grid. A carrier at or above Nyquist raises `RangeError`.

The optional `fftList` property is an array of frequencies in hertz. `mod()` replaces its contents with the computed FFT frequencies while preserving the array itself. Without `fftList`, `mod()` replaces the selected context's `fList` with its computed frequencies. To build a circuit, create its context, set its `fList` to an empty array, call `mod()`, and then construct the components with their usual defaults:

```js
var g = nP.global();
g.fList = [];
var tx = nP.mod({mode: 'PN7', carrierHz: 0});
var stage = nP.Attn(3);
var chain = nP.cascade(stage, {signal: tx});
```

For another independent circuit, call `var h = nP.global()` and repeat the workflow with `h.fList`. Call `nP.global(g)` to select the first circuit again when constructing more components for it. The existing `nP.global.fList = ...` form continues to work for a single circuit. `mod()` sets the selected context's `fList` when `fftList` is omitted.

`mod()` uses `FFT()` internally and produces a plain signal description with `fList`, complex `spectrum`, `bits`, `sampleCount`, `sampleRateHz`, `samplesPerBit`, and `referenceImpedanceOhms`. In ASCII mode, each character is encoded as eight bits, most-significant bit first. In bits mode, supply `bits: '0101'` or an array of zeros and ones. The sequence is treated as one repeating period. Construct components after `mod()` so their frequency rows match. Pass the source as the final connection argument: `nP.nodal([stage, 1, 2], ['out', 1, 2], {signal: tx, inputPort: 1})` or `nP.cascade(stage, {signal: tx, inputPort: 1})`. Input port 1 is the default. `nP.global.twoTone` must be unset.

```js
tx.out('mode');            // 'PN2' through 'PN16', 'ASCII', or 'bits'
tx.out('bit count');       // bits in one repeated sequence
tx.out('sample count');    // time samples in one repeated sequence
tx.out('frequency count'); // FFT frequencies, including DC
tx.out('frequencies');     // copy of the frequency array in Hz
tx.out('spectrum');        // copy of the complex FFT values
```

For the 68-character ASCII message in `dev/timeDomainDevelopment.html`, `tx.out('frequency count')` returns `2177`. Unknown selectors raise `RangeError`.

For explicit on-off keying or two-level amplitude-shift keying, set `mode` to `'OOK'` or `'ASK'`. Both require a positive `carrierHz` below the sample Nyquist frequency. `dataMode` chooses the bit source and defaults to `'PN7'`; `message` infers `'ASCII'`, and `bits` infers `'bits'` when `dataMode` is omitted. A `PN()` waveform can instead be passed as `input`, with its bits mapped to the selected voltage levels.

```js
// mod: On-Off Keying
var ook = nP.mod({
    mode: 'OOK',
    carrierHz: 200e6, // Hz; required and positive
    dataMode: 'PN7',   // 'PN2' through 'PN16', 'ASCII', or 'bits'; default 'PN7'
    lowVolts: 0,       // bit 0; must be zero
    highVolts: 1       // bit 1; positive peak V
});
// returns a sampled signal description, not an nPort object
```

```js
// mod: two-level Amplitude Shift Keying
var ask = nP.mod({
    mode: 'ASK',
    carrierHz: 200e6, // Hz; required and positive
    dataMode: 'PN7',   // 'PN2' through 'PN16', 'ASCII', or 'bits'; default 'PN7'
    lowVolts: 0.5,     // bit 0; positive peak V, default 0.5
    highVolts: 1       // bit 1; greater than lowVolts, default 1
});
// returns a sampled signal description, not an nPort object
```

All other sampled-waveform options, including `bitRate`, `samplesPerBit`, `seed`, `message`, `bits`, `input`, and `fftList`, retain their existing meanings. `tx.out('mode')` returns `'OOK'` or `'ASK'`, and `tx.out('settings').dataMode` reports the bit source. The completed nPort carries both through `nodal()` and `cascade()`. `demod(chain).out('mode')` and `.out('data mode')` report them after coherent detection; `out('bits')`, `out('ASCII text')`, and `bitErrorRate()` still work.

For single-tone analog AM, `mod()` uses three complex peak-voltage phasors rather than sampled bits or an FFT. The carrier and tone frequencies are required; the modulation index defaults to 0.5 and the carrier peak voltage to 1 V. The modulation index must be between 0 and 1, and the carrier must exceed the tone frequency.

```js
// mod: single-tone analog amplitude modulation
var tx = nP.mod({
    mode: 'AM',
    carrierHz: 200e6,        // Hz; required
    toneHz: 300,             // Hz; required
    modulationIndex: 0.5,    // 0 through 1; default 0.5
    carrierAmplitudeVolts: 1 // peak V; default 1
});
// returns a three-tone signal description, not an nPort object
```

`tx.fList` and the selected context's `fList` contain `[carrierHz - toneHz, carrierHz, carrierHz + toneHz]`. The input peak-voltage phasors are `[mA/2, A, mA/2]`, where `m` is the modulation index and `A` is the carrier peak voltage. `tx.out('settings')`, `out('tones')`, `out('frequencies')`, `out('frequency count')`, `out('frequency table')`, and `out('spectrum')` are available. As in digital mode, `fftList` can receive the frequencies in place instead of replacing the selected context's `fList`; the property name reflects the existing API, although AM performs no FFT. Construct components after `mod()` and attach `{signal: tx}` to the final `nodal()` or `cascade()` call.

Single-tone analog FM uses the same sparse-frequency nPort path. `beta` is the modulation index, so the unfiltered peak frequency deviation is `beta * toneHz`. `mod()` calculates the signed sideband coefficients of `exp(i * beta * sin(2π * toneHz * t))` with an FFT of the **modulation phase**, not of the RF waveform. It retains sidebands from order `-N` through `+N` until omitted spectral power is below `sidebandPowerTolerance`, which defaults to `1e-6`. This makes the number of S-parameter rows depend on `beta`.

```js
// mod: single-tone analog Frequency Modulation
var tx = nP.mod({
    mode: 'FM',
    carrierHz: 200e6,          // Hz; required and positive
    toneHz: 300,               // Hz; required and positive
    beta: 5,                   // required; nonnegative modulation index
    carrierAmplitudeVolts: 1,  // peak V; default 1
    sidebandPowerTolerance: 1e-6 // omitted power fraction; default 1e-6
});
// returns a sparse multi-tone signal description, not an nPort object
```

`tx.out('settings')` reports `sidebandOrder`, `frequencyCount`, and `frequencyDeviationHz`. `tx.out('tones')` reports every input tone's frequency, peak voltage, and phase. Other selectors are `frequencies`, `frequency count`, `frequency table`, and `spectrum`. `fftList` can receive the generated frequencies in place; although that option retains its name for consistency, FM does not create a full RF FFT grid. A lower sideband at or below 0 Hz is rejected.

Single-tone PM uses the same sparse sideband path, but `beta` means peak phase deviation in radians: the source phase is `beta * cos(2π * toneHz * t)`. Its first sidebands are approximately `beta / 2` of the carrier when beta is small. The sideband count grows with beta, and the input's peak instantaneous frequency deviation is `beta * toneHz`.

```js
// mod: single-tone analog Phase Modulation
var tx = nP.mod({
    mode: 'PM',
    carrierHz: 200e6,             // Hz; required and positive
    toneHz: 300,                  // Hz; required and positive
    beta: 0.1,                   // required; nonnegative peak phase radians
    carrierAmplitudeVolts: 1,   // peak V; default 1
    sidebandPowerTolerance: 1e-6 // omitted power fraction; default 1e-6
});
// returns a sparse multi-tone signal description, not an nPort object
```

PM supports the same transmitter `.out()` selectors as FM; `out('settings')` also reports `peakPhaseRadians`. The optional `fftList` receives the generated frequencies in place. Construct components after `mod()`, then attach `{signal: tx}` to the final `nodal()` or `cascade()` call.

Binary FSK uses the sampled digital path and accepts the same PN, ASCII, raw bits, or PN clock input choices as OOK and ASK. A zero bit selects `carrierHz - frequencyDeviationHz`; a one bit selects `carrierHz + frequencyDeviationHz`. The generated cosine phase is continuous across bit boundaries.

```js
// mod: binary Frequency Shift Keying
var tx = nP.mod({
    mode: 'FSK',
    carrierHz: 200e6,           // Hz; required and positive
    bitRate: 10e6,              // bits/s; default 1e9
    samplesPerBit: 64,          // integer; default 8
    message: 'Hi',              // ASCII data; PN7 is the default data mode
    frequencyDeviationHz: 5e6, // positive; default bitRate / 2
    carrierAmplitudeVolts: 1    // peak V; default 1
});
// returns a sampled digital signal description, not an nPort object
```

The lower tone must remain positive, and the upper tone must be below the sample Nyquist frequency. `tx.out('settings')` adds `lowFrequencyHz`, `highFrequencyHz`, `frequencyDeviationHz`, and `carrierAmplitudeVolts`. Use `dataMode: 'bits'` with `bits`, or `dataMode: 'PN7'`; an `input` from `PN()` is also accepted. `fftList` can receive the FFT grid in place.

Binary PSK uses a single positive carrier frequency. A 0 has 180° phase and a 1 has 0° phase, both at the same peak amplitude. It accepts the same PN, ASCII, raw bits, or PN clock input choices as FSK. The carrier must be below the sample Nyquist frequency.

```js
// mod: binary Phase Shift Keying
var tx = nP.mod({
    mode: 'PSK',
    carrierHz: 200e6,          // Hz; required and positive
    bitRate: 10e6,             // bits/s; default 1e9
    samplesPerBit: 64,         // integer; default 8
    message: 'Hi',             // ASCII data; PN7 is the default data mode
    carrierAmplitudeVolts: 1   // peak V; default 1
});
// returns a sampled digital signal description, not an nPort object
```

`tx.out('settings')` reports `phaseZeroDeg: 180`, `phaseOneDeg: 0`, `carrierAmplitudeVolts`, and the sampled frequency count. `dataMode`, `bits`, `input`, and `fftList` follow the FSK input conventions.

Set `encoding: 'Manchester'` for bi-phase PSK. The default is `'NRZ'`, the existing whole-bit phase mapping. Manchester sends 0° then 180° for a 1, and 180° then 0° for a 0. The two halves have equal duration, so every bit has a mid-bit phase reversal. In an aligned FFT analysis, their equal and opposite carrier contributions cancel even for repeated identical bits.

```js
// mod: Manchester-coded binary Phase Shift Keying
var tx = nP.mod({
    mode: 'PSK',
    encoding: 'Manchester',    // NRZ by default
    carrierHz: 200e6,         // Hz; required and positive
    bitRate: 10e6,            // bits/s; default 1e9
    samplesPerBit: 64,        // even integer; default 8
    message: 'Hi',            // ASCII data; PN7 is the default data mode
    carrierAmplitudeVolts: 1  // peak V; default 1
});
// returns a sampled digital signal description, not an nPort object
```

`tx.out('settings').encoding` reports the selected encoding. `tx.out('frequencies')` and `tx.out('spectrum')` expose the generated FFT bins. Manchester requires an even `samplesPerBit` of at least two. The encoding is retained on the nPort when the signal passes through `nodal()` or `cascade()`.

### `demod`

```js
// demod: Demodulator; baseband or coherent cosine carrier
var rx = nP.demod(chain, {noise: true}); // noise defaults to true
var bits = rx.out('bits');
var directRx = nP.demod(tx);             // direct connection; no nPort needed
// returns a receiver result with an out() method
```

`demod()` accepts receiver options such as `outputPort`, `inputPort`, `noise`, `thresholdVolts`, and `referenceTemperature`. Pass either a completed nPort carrying a signal or the result of `mod()` directly. The direct form uses an internal ideal matched connection with the transmitter's frequency grid and reference impedance; it does not depend on the currently selected global circuit. It draws matched-source thermal noise by default in either form; `{noise: false}` disables the random noise realization. For a positive carrier, it reconstructs the received passband waveform, correlates each bit interval with a cosine at the transmitted carrier frequency and zero phase, then decides bits from the recovered levels. `out('carrier waveform')` and `out('carrier spectrum')` expose the received passband data; `out('waveform')` and `out('spectrum')` expose the recovered bit levels. This path assumes the carrier phase and bit timing are known; it does not recover either from the signal.

`demod()` needs only the completed nPort because its `.signal` contains the complex output waves. It draws a new random noise spectrum from the nPort's calculated source, termination, and component noise on each call, then uses `invFFT()` to reconstruct received samples. The output port can be any valid port of that nPort. `inputPort` defaults to 1, and the noise calculation uses the same matched 290 K source and termination conditions as `out('noiseFloor')` unless measurement options specify otherwise. Set `noise: false` to recover the deterministic waveform.

For an AM signal, `demod()` instead uses the three propagated output phasors. It reports `out('envelope')` as a time-and-voltage table over one modulation period, `out('phase')` as a time-and-phase-deviation table in degrees relative to the output carrier, and `out('amToPmDeg')` as the largest absolute phase deviation on that table. The default table has 1,001 points; `{points: 201}` selects another count. `out('tones')` returns frequency, output peak voltage, phase, and power for the selected output port. AM demodulation is deterministic; `{noise: true}` is rejected because random AM receiver noise has not been implemented. The AM signal metadata is retained when the nPort is reused in `nodal()` or `cascade()`.

For FM, `demod()` sums the propagated sideband phasors into a complex envelope. `out('envelope')` gives its magnitude, `out('phase')` its wrapped phase deviation from the first time point, and `out('frequency deviation')` the instantaneous frequency offset in hertz, calculated from the complex envelope derivative. `out('peak frequency deviation Hz')` is the largest absolute value in that table. `out('tones')` and `out('frequencies')` inspect the propagated spectrum. The default table has 1,001 points over one modulation period; `{points: 201}` changes it. This FM path is deterministic, and `{noise: true}` is rejected.

For PM, `demod()` uses the same phasor sum. `out('phase')` returns an unwrapped degree-valued phase trace centered on its period mean; `out('peak phase deviation radians')` gives its largest absolute swing. `out('envelope')`, `out('frequency deviation')`, `out('peak frequency deviation Hz')`, `out('tones')`, and `out('frequencies')` are also available. `{points: 201}` changes the trace length; high beta requires enough points to unwrap phase. Random receiver noise is not yet included.

For FSK, `demod()` reconstructs the passband waveform, compares in-phase and quadrature energy at the two known tones over each bit interval, and chooses the stronger tone. It uses known bit timing but does not need a carrier phase reference. `out('bits')` and `out('ASCII text')` return decisions; `out('tone energies')` gives one row per bit; `out('tone frequencies Hz')` returns the two tones. `out('waveform')`, `out('spectrum')`, and `out('frequencies')` expose the received passband data. Receiver noise is on by default and can be disabled with `{noise: false}`.

For PSK with default NRZ encoding, `demod()` correlates each bit interval with a zero-phase carrier and decides 1 for a positive result and 0 for a negative result. With Manchester encoding, the receiver reverses its reference for the second half-bit before making the same decision. The default decision threshold is zero volts. `out('encoding')` reports `'NRZ'` or `'Manchester'`; `out('bits')`, `out('ASCII text')`, `out('waveform')`, and `out('carrier waveform')` use the ordinary sampled digital receiver API. Both are coherent detection: bit timing and carrier phase must already be known. There is no carrier phase recovery or differential decoding. Noise is on by default and can be disabled with `{noise: false}`.

```js
var rx = nP.demod(chain, {outputPort: 2}); // output port 2 is the default
rx.out('bit count');       // received bit count, when bit timing is available
rx.out('bits');            // decoded array of 0 and 1 decisions
rx.out('sample count');    // received time samples
rx.out('frequency count'); // frequency bins, including DC
rx.out('frequencies');     // copy of the frequency array in Hz
rx.out('spectrum');        // copy of the complex received voltage FFT bins
rx.out('waveform');        // chart-ready Time (ns), Output (V) table
rx.out('ASCII text');      // decoded JavaScript string
```

The spectrum, waveform, bits, and text use the same received noise realization. Unknown selectors raise `RangeError`. If combined signals have no common bit timing, `out('bit count')`, `out('bits')`, and `out('ASCII text')` are unavailable. For ASCII reception, `demod()` samples the center of each bit and estimates the centers of two voltage clusters to choose a decision threshold. Set `thresholdVolts` for a known level. The bit count must form complete bytes; a received byte above seven-bit ASCII becomes `�`. It does not recover a clock or correct errors. Use `referenceTemperature` to change modeled source and unused-port termination noise temperature.

### `bitErrorRate`

```js
// bitErrorRate: compare known transmitted bits with independent receiver decisions
var ber = nP.bitErrorRate(tx, chain, {receptions: 100});
// returns a number: bit errors divided by total received bits
```

The helper calls `demod(chain)` once per reception and compares `out('bits')` with the known `tx.bits`. The receiver itself does not need the transmitter. `receptions` defaults to 100 and must be a positive integer. Receiver options such as `outputPort`, `thresholdVolts`, and `referenceTemperature` can be passed in the same options object. At one percent BER, a 544-bit message produces only about five errors on average, so repeated receptions give a steadier estimate.

## The `nPort` object

Every electrical constructor above returns an `nPort` object. `nP.nodal()`, `nP.cascade()`, and the instance method `.cas()` also return one. The base `nPort` constructor is internal; browser users create n-ports through the public component and combining functions.

### Data carried by an n-port

```js
// nPort: common data carried by every electrical component
var stage = nP.Attn();

var sRows = stage.spars;       // same rows returned by stage.getspars()
var settings = stage.global;   // same object returned by stage.getglobal()
var noiseRows = stage.noise;   // frequency-aligned noise covariance rows
var signal = stage.signal;     // deterministic waveform, when present
```

Each `spars` row starts with frequency in hertz, followed by a complete **row-major** S matrix of `nP.complex()` values. For a two-port, one row has this shape:

```js
// nPort.spars: one frequency and a row-major two-port S matrix
var sRow = [
    frequency, // Hz
    s11,       // row 1, column 1
    s12,       // row 1, column 2
    s21,       // row 2, column 1
    s22        // row 2, column 2
];
```

Each `noise` row has the same frequency and a full complex covariance matrix. A two-port row has this shape:

```js
// nPort.noise: intrinsic two-port noise covariance at one frequency
var noiseRow = {
    frequency: frequency,
    C: [
        [c11, c12],
        [c21, c22]
    ]
};
```

For an *n*-port, each S row contains `1 + n²` entries and each `C` has *n* rows and *n* columns. `C` describes the component's own outgoing noise waves in W/Hz; source and termination noise are added during an NF or noise-floor measurement. Passive parts without an explicit noise model derive thermal covariance from their S matrix and construction temperature when `.noise` is first read. Active parts such as `Amp()` and biased `diode1N4148()` provide their own covariance. The `.global` field is a snapshot of the settings used to build the nPort; changing `nP.global.fList` later does not change existing S rows or metadata. Some constructors also attach model-specific metadata such as `.microstrip`, `.diode`, or `.physicalModel`.

When a digital transmitter is connected, `.signal` contains `sampleCount`, `sampleRateHz`, `samplesPerBit`, `referenceImpedanceOhms`, and `rows`. Each row has the same frequency as its S row and a `waves` array of one complex outgoing wave per port. `nodal()`, `cascade()`, and `.cas()` propagate these wave vectors and retain them on the resulting nPort. The sources must have matching sample grids and reference impedances. `demod()` reads this data without referring back to the transmitter.

For analog AM, FM, or PM, `.signal` retains the mode, carrier and tone frequencies, and frequency-aligned wave rows. FM and PM also retain `beta` and `sidebandOrder`. `chain.out('signal2V', 'signal2Deg', 'signal2dBm')` returns the actual output signal at port 2 for each retained tone. Replace `2` with another output port number for a multiport. The voltage is peak voltage, the phase is in degrees, and the power assumes the nPort's reference impedance. These selectors require an AM, FM, or PM signal; `s21dB` remains the circuit transfer gain rather than the driven signal level.

### Reading and setting S and global data

```js
// nPort: S-parameter and analysis-setting accessors
var sRows = stage.getspars();    // returns stage.spars
var settings = stage.getglobal(); // returns stage.global

stage.setspars(
    replacementRows // frequency-aligned rows of complex S values
);

stage.setglobal(
    nP.global // active analysis settings
);
```

`setspars()` and `setglobal()` are mainly for constructor authors. They store the supplied data; they do **not** recalculate a component from new settings. `setglobal()` captures the current temperature for passive noise fallback and the display frequencies when two-tone analysis is configured. If `.noise` has already been set, `setspars()` checks its frequency and port dimensions against the replacement rows. Direct changes to `.spars` or `.noise` can break that alignment, so reconstruct a component when its physical inputs change. Assigning `.noise` requires rows shaped like the covariance example above.

### Combining two-ports with `.cas()`

```js
// nPort.cas: cascade this two-port with another two-port
var amp = nP.Amp();
var attenuator = nP.Attn();
var chain = amp.cas(
    attenuator // another two-port nPort
);
```

`cas()` returns a **new** two-port. It combines the S matrices, noise covariance, deterministic signal waves when present, and known internal intermodulation sources without changing either input object. Both inputs must have the same frequency rows. `nP.cascade(amp, attenuator)` performs the same two-port operation; `nP.nodal()` handles arbitrary multiport connections.

Here, `stage` is the single attenuator used in the earlier data examples. `chain` is the amplifier followed by the attenuator. Both `.out()` examples below measure `chain`: the first uses the default measurement conditions, and the second supplies a final options object to specify them.

### Extracting results with `.out()`

```js
// nPort.out: extract gain, noise, and intermodulation results
var table = chain.out(
    's21dB',          // S21 magnitude in dB
    'NF21dB',         // noise figure: output port 2, input port 1
    'noiseFloor',     // output noise density at port 2, dBm/Hz
    'OIP3lower21dBm' // two-tone output intercept, if configured
);
```

`out()` returns a chart-ready numeric table: `['Freq', ...selectors]` followed by one row per frequency selected when the nPort was constructed. The port digits are **output row, input column**; `NF31dB` means output port 3 from input port 1. Supported selector families are:

- `s21dB`, `s21mag`, `s21ang`, `s21Re`, `s21Im`: S-parameter magnitude in dB, linear magnitude, phase in degrees, real part, or imaginary part.
- `c22`, `c12Re`, `c12Im`, `c12mag`, `c12dB`: intrinsic noise covariance entries; `c22` means the real part.
- `NF21` or `NF21dB`: linear noise factor or noise figure in dB.
- `noiseFloor` or `noiseFloor31dBmHz`: output noise density in dBm/Hz; `noiseFloor` means port 2 from port 1.
- `IM2sum21dBm`, `IM2diff21dBm`, `IM3lower21dBm`, `IM3upper21dBm`: two-tone product power.
- `H2f121dBm`, `H2f221dBm`: second-harmonic power for the first or second tone.
- Matching `OIP...dBm` and `OIP2f...dBm` forms: extrapolated output intercepts.

The S and covariance selectors shown here use single-digit port numbers. NF, noise-floor, IM, harmonic, and OIP selectors also accept parenthesized ports for larger n-ports, for example `NF(10,1)dB`. Intermodulation selectors require a two-tone setup.

An optional final options object sets the noise measurement conditions:

```js
// nPort.out: specify source and termination conditions
var measured = chain.out(
    'NF21dB',
    'noiseFloor',
    {
        source: {
            reflection: nP.complex(0, 0) // source Γ; number or complex
        },
        terminations: {
            2: {
                reflection: 0, // output-load Γ; number or complex
                temperature: 0 // K
            }
        },
        referenceTemperature: 290 // K
    }
);
```

By default, the source and all terminations are matched. The source and unused-port terminations are at 290 K; the selected output termination is at 0 K. `noiseFloor` is a 1 Hz output noise density. For intermodulation, the final options object can also contain `twoTone` to override the object's configured two-tone settings for that call.

### Older output methods

```js
// nPort.noiseOut and nPort.outTable: older output methods
var covarianceTable = stage.noiseOut(
    'c11', // real part of C11
    'c12'  // real part of C12
);

var sTable = stage.outTable(
    's11dB', // S11 in dB
    's21dB'  // S21 in dB
);
```

Both methods still exist. `noiseOut()` extracts covariance entries only; `outTable()` extracts S-parameter values only. Use `.out()` for new code because it accepts both kinds plus NF, noise floor, and intermodulation results in one table. Unlike `.out()`, the older methods walk every internal frequency row, including two-tone product rows.

## Math constructors and array helpers

These are all six public exports from `src/np-math`. The returned complex and matrix objects also have the methods listed below. **None of the six functions has a default argument.** The numbers below are example inputs, not defaults.

### `complex`

```js
// complex: complex
var z = nP.complex(
    3, // real: number
    4  // imaginary: number
);
// returns a complex object with numeric .x and .y fields
```

### `matrix`

```js
// matrix: matrix
var A = nP.matrix(
    [                // mat: two-dimensional array
        [1, 0],      // row 1; entries may be numbers or nP.complex() values
        [0, 1]       // row 2
    ]
);
// returns a matrix object with its entries in .m
// The input array is held by reference; use nP.dup() first for a separate array.
```

### `dim`

```js
// dim: dimension
var cells = nP.dim(
    2, // rows: nonnegative integer
    3, // cols: nonnegative integer
    0  // initial: value placed in every cell; any type
);
// returns a two-dimensional JavaScript array
// If initial is an object, each cell initially refers to that same object.
```

### `dup`

```js
// dup: duplicate
var copiedCells = nP.dup(
    cells // copied: nonempty two-dimensional array
);
// returns a new outer array and new row arrays
// Entries are copied by reference, so contained objects are shared.
```

### `FFT`

```js
// FFT: fast Fourier transform
var spectrum = nP.FFT(
    [1, 0, 0, 0] // samples: nonempty array of numbers or nP.complex() values
);
// returns an array of nP.complex() values, in FFT-bin order
```

`FFT()` accepts any nonempty length, including 1,016 samples for one oversampled PN7 period. It uses the forward sign convention `exp(-i 2πkn/N)` and does not divide by `N`. It does not calculate a frequency list. At sample rate `Fs`, bin `k` is at `k * Fs / N` through Nyquist; higher bins represent negative frequencies at `(k - N) * Fs / N`.

### `invFFT`

```js
// invFFT: inverse fast Fourier transform
var samples = nP.invFFT(
    spectrum // nonempty array of numbers or nP.complex() values
);
// returns an array of nP.complex() time samples
```

`invFFT()` uses `exp(+i 2πkn/N)` and divides by `N`, so `invFFT(FFT(samples))` recovers the original samples to floating-point precision. Real inputs may return tiny imaginary roundoff values.

### Complex object methods

The following methods are available on every value returned by `nP.complex()`. Arithmetic leaves `z` unchanged and returns a new complex object. Angle is in degrees.

```js
var z = nP.complex(3, 4);
var other = nP.complex(2, -1);

z.getR();          // returns the real part as a number
z.getI();          // returns the imaginary part as a number

z.add(other);      // returns a new complex sum
z.sub(other);      // returns a new complex difference
z.mul(other);      // returns a new complex product
z.div(other);      // returns a new complex quotient
z.inv();           // returns a new complex reciprocal
z.neg();           // returns a new complex value with both signs reversed
z.copy();          // returns a new complex object with the same value

z.mag();           // returns magnitude as a number
z.ang();           // returns angle in degrees as a number
z.mag10dB();       // returns 10 * log10(magnitude) as a number
z.mag20dB();       // returns 20 * log10(magnitude) as a number
z.sinhCplx();      // returns a new complex hyperbolic sine
z.coshCplx();      // returns a new complex hyperbolic cosine

z.set(3, 4);       // changes z.x and z.y; returns z
z.setR(3);         // changes z.x; returns z
z.setI(4);         // changes z.y; returns z
```

### Matrix object methods

Use the plain methods with numeric entries and the `Cplx` methods with `nP.complex()` entries. Matrix arithmetic, copying, transposition, inversion, and solving return new matrix objects. `set()` changes the receiver.

```js
var A = nP.matrix([[2, 1], [1, 2]]);
var B = nP.matrix([[1, 0], [0, 1]]);

A.add(B);          // returns a new matrix with elementwise sums
A.sub(B);          // returns a new matrix with elementwise differences
A.mul(B);          // returns a new matrix product
A.transpose();     // returns a new matrix with rows and columns exchanged
A.invert();        // returns a new inverse matrix; A is unchanged
A.copyMatrix();    // returns a new matrix with copied row arrays
A.dimension(2, 3, 0); // returns a new 2-by-3 matrix filled with zeros
A.set([[3, 0], [0, 3]]); // changes A.m; returns A
```

`copyMatrix()` and `transpose()` copy or rearrange array entries by reference. Complex values in those results can still refer to the same objects as in the input.

```js
var c = nP.complex;
var Ac = nP.matrix([[c(2, 0), c(1, 1)], [c(1, -1), c(2, 0)]]);
var Bc = nP.matrix([[c(1, 0), c(0, 0)], [c(0, 0), c(1, 0)]]);

Ac.addCplx(Bc);        // returns a new matrix with complex sums
Ac.subCplx(Bc);        // returns a new matrix with complex differences
Ac.mulCplx(Bc);        // returns a new complex matrix product
Ac.transposeCplx();   // returns a new conjugate-transpose matrix
Ac.invertCplx();      // returns a new complex inverse; Ac is unchanged
```

The solve methods take an **augmented matrix**: coefficient columns followed by one right-hand-side column. Their result is a new one-column matrix of solutions. The input matrix is unchanged.

```js
var realSystem = nP.matrix([[2, 1, 5], [1, -1, 1]]);
realSystem.solveGaussFB(); // returns [[2], [1]] as a matrix

var c = nP.complex;
var complexSystem = nP.matrix([
    [c(2, 0), c(1, 0), c(5, 0)],
    [c(1, 0), c(-1, 0), c(1, 0)]
]);
complexSystem.solveGaussFBCplx(); // returns a complex one-column matrix
```

## Low-pass filter helpers

Four helpers are exported: `chebyLPNsec()` chooses the section count, `chebyLPgk()` calculates normalized prototype values, `chebyLPLCs()` scales them to component values, and `lpfGen()` builds the two-port filter. The first three return numbers or arrays; `lpfGen()` returns an nPort that can be used in NF and IP analysis.

### `chebyLPNsec`

```js
// chebyLPNsec: Chebyshev Low Pass Number of sections
var sections = nP.chebyLPNsec(
    0.2, // passFreq: frequency, same units as rejFreq
    1.5, // rejFreq: rejection frequency
    0.1, // ripple: passband ripple, dB
    30   // rejection: stopband rejection, dB
);
```

Returns the calculated integer section count.

### `chebyLPgk`

```js
// chebyLPgk: Chebyshev Low Pass g k
var g = nP.chebyLPgk(
    3,   // n: number of sections, integer
    0.1  // ripple: passband ripple, dB
);
```

Returns an array of normalized Chebyshev `g` values.

### `chebyLPLCs`

```js
// chebyLPLCs: Chebyshev Low Pass Inductors Capacitors
var parts = nP.chebyLPLCs(
    [
        1,                  // cheby[0]: source g value
        1.0315851425078764,// cheby[1]
        1.1474003299537219,// cheby[2]
        1.0315851425078761,// cheby[3]
        1                   // cheby[4]: load g value
    ],
    0.2e9, // maxPassFrequency: Hz
    50     // zo: Ω
);
```

Returns the source and load resistances plus alternating capacitor and inductor values. The array shown is the default `cheby` argument.

### `lpfGen`

```js
// lpfGen: low pass filter Generator
nP.lpfGen([
    50,                       // filt[0]: source resistance, Ω
    1.641818746502858e-11,  // filt[1]: shunt capacitance, F
    4.565360855435164e-8,  // filt[2]: series inductance, H
    1.6418187465028578e-11, // filt[3]: shunt capacitance, F
    50                        // filt[4]: load resistance, Ω
]);
// returns an nPort object
```

These are the defaults when `filt` is omitted. `lpfGen()` cascades ideal capacitors and inductors; it does not generate intermodulation products itself, but it changes the levels of products passing through it. It removes the endpoint resistances from a **supplied array**, so use `nP.lpfGen(values.slice())` to preserve `values`.

## Network composition

These functions create n-port objects from existing n-port objects. They have no default arguments.

### `cascade`

```js
// cascade: cascade
nP.cascade(
    firstTwoPort, // n-port object
    secondTwoPort // n-port object; more may follow
);
// returns an nPort object
```

### `nodal`

```js
// nodal: nodal
nP.nodal(
    [component, 1, 2], // component plus one node label per port
    ['out', 1, 2]       // required external-port labels
);
// returns an nPort object
```

`nP.lineChart()`, `nP.lineTable()`, and `nP.smithChart()` are display functions, not electrical n-port constructors.

**Keep this catalog current:** Add each new public n-port, math, or prototype constructor here when its source export is added, and update its block whenever an argument or default changes.

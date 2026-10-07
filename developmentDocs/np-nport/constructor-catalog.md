<!-- Modified: 2026-10-07 -->
# nP constructor catalog

This catalog covers the 50 public functions that produce n-port objects, from `src/np-nport/src/index.js`, plus the exported math and low-pass prototype functions. Each JS call below spells out the **current defaults** where they exist. Each argument or property appears on its own line. Units are in comments. Each constructor has its own heading and code block.

Parameter spelling follows the public API. Legacy positional names such as `R`, `N`, `Z`, and `Length` retain their source capitalization; physical options use `lowerCamelCase` property names. Positional argument order matters. Named object properties follow one presentation order: geometry, material and loss, then temperature.

Set the analysis frequencies before constructing components. The shared defaults are:

```js
// Shared analysis defaults and length units
nP.global.fList = [2e9]; // Hz
nP.global.Ro = 50;       // Ω
nP.global.Temp = 293;    // K

const mil = 25.4e-6;     // m; used in the examples below
const inch = 0.0254;     // m
```

If `nP.global.twoTone` is set, constructors also create S and noise rows at the required product frequencies.

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

The following constructors take no arguments.

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

For the physical object forms, use `resistivity` in Ω·m. Legacy `rho` defaults to **1** as a copper multiplier for `mlin`, `mclin`, `mtee`, `mstep`, `mbend`, and `mcross`; for `mvia` and `mvgnd` it defaults to **`1.72e-8 Ω·m`**. Do not supply `rho` and `resistivity` together. Other legacy property aliases are described in `developmentDocs/physical-model-api.md`.

## Diode

`diode1N4148` takes one options object. Its properties are JavaScript numbers; `ivPoints` is an integer.

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

## The `nPort` object

Every electrical constructor above returns an `nPort` object. `nP.nodal()`, `nP.cascade()`, and the instance method `.cas()` also return one. The base `nPort` constructor is internal; browser users create n-ports through the public component and combining functions.

### Data carried by an n-port

```js
// nPort: common data carried by every electrical component
var stage = nP.Attn();

var sRows = stage.spars;       // same rows returned by stage.getspars()
var settings = stage.global;   // same object returned by stage.getglobal()
var noiseRows = stage.noise;   // frequency-aligned noise covariance rows
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

For an *n*-port, each S row contains `1 + n²` entries and each `C` has *n* rows and *n* columns. `C` describes the component's own outgoing noise waves in W/Hz; source and termination noise are added during an NF or noise-floor measurement. Passive parts without an explicit noise model derive thermal covariance from their S matrix and construction temperature when `.noise` is first read. Active parts such as `Amp()` and biased `diode1N4148()` provide their own covariance. The `.global` field refers to the shared settings object; the calculated S rows do not automatically change if `global.fList` or a physical parameter is changed later. Some constructors also attach model-specific metadata such as `.microstrip`, `.diode`, or `.physicalModel`.

### Reading and setting S and global data

```js
// nPort: S-parameter and analysis-setting accessors
var sRows = stage.getspars();    // returns stage.spars
var settings = stage.getglobal(); // returns stage.global

stage.setspars(
    replacementRows // frequency-aligned rows of complex S values
);

stage.setglobal(
    nP.global // analysis settings object
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

`cas()` returns a **new** two-port. It combines the S matrices, noise covariance, and known internal intermodulation sources without changing either input object. Both inputs must have the same frequency rows. `nP.cascade(amp, attenuator)` performs the same two-port operation; `nP.nodal()` handles arbitrary multiport connections.

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

`out()` returns a chart-ready numeric table: `['Freq', ...selectors]` followed by one row per displayed `global.fList` frequency. The port digits are **output row, input column**; `NF31dB` means output port 3 from input port 1. Supported selector families are:

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

These are all four public exports from `src/np-math`. The returned complex and matrix objects also have the methods listed below. **None of the four functions has a default argument.** The numbers below are example inputs, not defaults.

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

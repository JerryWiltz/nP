<!-- Modified: 2026-10-07 -->
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

var amp = nP.Amp({gainDb: 20, noiseFigureDb: 4,
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

`nP.diode1N4148()` uses its DC bias point to generate a small-signal noise covariance and one-pass IM2, IM3, and second-harmonic sources. The noise model includes series-resistance thermal noise and an approximate junction-current noise level. The nonlinear source uses local current and junction-charge derivatives, so it is a weak-signal estimate around the selected bias, not a large-signal diode simulation or a datasheet-calibrated intercept model.

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
| Analysis settings | `nP.global`, `fGen()` |
| Lumped components | `R()`, `L()`, `C()` |
| Ideal fixtures | `Open()`, `Short()`, `Load()`, `Tee()`, `Tee4()`, `Tee5()`, `seriesTee()` |
| Ideal transmission lines | `Tlin()`, `Tclin()` |
| Network assembly | `nodal()`, `cascade()`, `nPort.cas()` |
| Data extraction | `nPort.out()` |
| Mathematics | `complex()`, `matrix()`, `dim()`, `dup()` |
| Filter prototypes | `chebyLPNsec()`, `chebyLPgk()`, `chebyLPLCs()` |
| Visualization | `lineChart()`, `lineTable()`, `smithChart()` |
| Nonlinear devices | `diode1N4148()` |

The older combined RLC constructors remain available for compatibility, but new examples favor explicit components and `nP.nodal()`.

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
- [`docs/legacy-api-reference.md`](docs/legacy-api-reference.md) preserves the former long-form README reference while it is modernized.

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

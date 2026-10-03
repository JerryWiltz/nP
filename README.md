<!-- Modified: 2026-10-03 -->
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
    oip2dBm: 42, oip3dBm: 30});
var attenuator = nP.Attn(3);
var chain = nP.nodal(
    [amp, 1, 2],
    [attenuator, 2, 3],
    ['out', 1, 3]
);

var result = chain.out('s21dB', 'IM2sum21dBm',
    'IM3lower21dBm', 'OIP3lower21dBm');
```

`fList` contains the displayed first-tone frequencies. `Amp()` and `Attn()` also create S and noise rows at the second tone and four IM product frequencies; `.out()` still returns one row per `fList` point. With the values above, these frequencies are 0.1, 0.9, 1.0, 1.1, 1.2, and 2.1 GHz. Other component constructors must also provide matching rows before they can be used in the same two-tone network.

The optional `oip2dBm` and `oip3dBm` values are output-referred, matched, equal-tone intercept specifications. Omitting either value means no products of that order. The first model generates products at the output of a matched, unilateral `Amp`; nonzero reflection or reverse-gain S-parameters with OIP inputs are rejected. Optional `im2PhaseDeg` and `im3PhaseDeg` adjust its product phases. Input phases can be set with `phase1Deg` and `phase2Deg` in `global.twoTone`.

Selectors `IM2diff21dBm`, `IM2sum21dBm`, `IM3lower21dBm`, and `IM3upper21dBm` report output product power for input port 1 and output port 2. Matching `OIP...` selectors report extrapolated output intercepts. For another port pair, change the two digits; for ports numbered 10 or higher, use parentheses such as `IM3lower(10,1)dBm`. `nodal()`, `cascade()`, and `nPort.cas()` preserve known internal Amp models through nested combinations. The calculation propagates generated waves once through the linear S-parameter network. It does not calculate compression, nonlinear remixing, or time averaging. When a product coincides with another product or a fundamental, the reported IM power is their coherent combined power; an OIP selector for that frequency raises an error because the separate intercept cannot be recovered.

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

Existing positional `mlin()`, `mclin()`, and `mtee()` calls remain supported, but options objects are preferred.

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

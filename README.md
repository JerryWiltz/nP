<!-- Modified: 2026-09-06 -->
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

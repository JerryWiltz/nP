<!-- Modified: 2026-10-23 -->
# nP

JavaScript tools for RF and microwave network analysis. Build n-port circuits, calculate S-parameters, model sampled signals, and display results as line charts, tables, or Smith charts. nP runs in browsers and is distributed as ESM, CommonJS, and UMD bundles.

nP is under active development. The current version is `0.0.48`; APIs may evolve before a stable release.

## Install

```sh
npm install @jerrywiltz/np
```

For a plain HTML page, download the [browser bundle](https://raw.githubusercontent.com/JerryWiltz/nP/master/dist/nP.js) as `nP.js` and load it with a script tag. The bundle exposes the global `nP` object.

## Quick start

This example builds a series resistor and inductor, extracts their S-parameters, and plots them:

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

The normal flow is to set analysis frequencies, create components, connect them with `nP.nodal()` or a two-port cascade, call `.out(...)`, and display the resulting table. See [Hello, nPort!](docs/hello-nport.md), [Connecting nPorts](docs/connecting-nports.md), and the [circuit examples](docs/circuit-examples.md) for more circuits.

## Module usage

```js
// ES module
import * as nP from '@jerrywiltz/np';
```

```js
// CommonJS
const nP = require('@jerrywiltz/np');
```

The local build outputs are `dist/nP.esm.js`, `dist/nP.cjs`, and the browser bundle `dist/nP.js`. The package uses the `@jerrywiltz` scope to distinguish it from the unrelated unscoped `np` package.

## Sampled signals

Use `nP.global.tList` to define uniform sample times before calling `waveform()` or `FFT()`. The FFT returns complex frequency bins and chart-ready output tables:

```js
var g = nP.global;
g.tList = g.tGen(0, 255e-3 / 256, 256);
g.fList = [];

var square = nP.waveform({shape: 'square', period: 1e-3});
var samples = square.out('samples');
var spectrum = nP.FFT(samples);

var timeTable = square.out('waveform');
var frequencyTable = spectrum.out('dBV');
nP.lineChart({inputTable: [timeTable], title: 'Square wave'});
nP.lineChart({inputTable: [frequencyTable], title: 'Square-wave spectrum', metricPrefix: 'kilo'});
```

`mod()` and `demod()` send sampled digital signals or VNA tones through n-port circuits. Start with [Digital signals](docs/digital-signals.md), then see the [waveform](docs/tech-notes-waveform-in-nport.md), [FFT](docs/tech-notes-fft-in-nport.md), [mod](docs/tech-notes-mod-in-nport.md), and [VNA](docs/tech-notes-vna-time-domain-reflection.md) notes for the engineering details.

## Capabilities

| Area | Main API | Detailed guide |
| --- | --- | --- |
| Analysis settings | `global`, `fGen()`, `tGen()` | [Global settings](docs/global-settings.md) |
| Lumped and ideal RF parts | `R()`, `L()`, `C()`, `Tee()`, `Tlin()`, `Tclin()`, `Coupler180()` | [RF constructors](docs/rf-constructors.md) |
| Network assembly | `nodal()`, `cascade()`, `nPort.cas()` | [Connecting nPorts](docs/connecting-nports.md) |
| S-parameters and output tables | `nPort.out()` | [nPort object](docs/nport-object.md) |
| Noise and intermodulation | `NF21dB`, `noiseFloor`, IM and OIP selectors | [Noise](docs/noise.md), [Intermodulation](docs/intermodulation.md) |
| Physical microstrip | `mlin()`, `mclin()`, `mtee()`, and related models | [Microstrip](docs/microstrip.md) |
| Diodes | `diode1N4148()` | [Diodes and active components](docs/diodes-and-active-components.md) |
| Digital signals | `waveform()`, `PN()`, `mod()`, `demod()`, `bitErrorRate()` | [Digital signals](docs/digital-signals.md) |
| Math | `complex()`, `matrix()`, `FFT()`, `invFFT()` | [Math](docs/math.md), [FFT in nPort](docs/tech-notes-fft-in-nport.md) |
| Visualization | `lineChart()`, `lineTable()`, `smithChart()`, `log()` | [Charts, tables, and logs](docs/charts-tables-and-logs.md) |

The older combined RLC constructors remain available for compatibility. New circuit examples favor named individual parts and explicit `nP.nodal()` connections.

## Documentation

Read the [published nP documentation](https://jerrywiltz.github.io/nP/) or try the [online REPL](https://jerrywiltz.github.io/nP/repl.html). The source pages are in [`docs/`](docs/). Engineering notes and model provenance are in [`developmentDocs/`](developmentDocs/); standalone browser harnesses are in [`dev/`](dev/).

The related **nPort RF Analysis** Obsidian plugin executes nP examples inside Markdown notes. It is maintained in a separate repository and uses its own pinned nP bundle.

## Development

Requirements: a current Node.js release and npm.

```sh
git clone https://github.com/JerryWiltz/nP.git
cd nP
npm install
npm test
npm run build
```

`src/index.js` is the public source entry point. `npm run docs:dev` starts the local documentation site; `npm run docs:build` verifies it. `npm run build:plugin` creates `dist/nP.plugin.esm.js` for an intentional update of the separately maintained Obsidian plugin; that bundle is not included in the npm package.

## Help and maintainer

For questions and bug reports, use [GitHub Issues](https://github.com/JerryWiltz/nP/issues). nP is maintained by [Jerry Wiltz](https://github.com/JerryWiltz).

## License

[MIT](LICENSE) © Jerry Wiltz

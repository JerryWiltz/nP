<!-- Modified: 2026-11-09 -->
# Restricted nP 0.49.0 plugin bundle audit

The restricted build starts at `src/plugin.js` and produces
`dist/nP.plugin.esm.js` with `npm run build:plugin`. It reports `0.49.0` and
includes the current RF, math, global, chart, schematic, and digital APIs.
The three main npm/browser bundles and the separately maintained Obsidian
plugin repository are not changed by this update.

## Source provenance

This restricted-entry update was prepared **after** the existing `v0.49.0` tag,
which points to `e711e354aeef6d559aba409b4268bebce7e43219`. The library version
remains `0.49.0`. The follow-up commit containing this audit, its source change,
tests, and regenerated bundle identifies this particular restricted build;
the version string alone does not distinguish it from the tagged release.
Record that follow-up commit when promoting the bundle to the Obsidian repository.

The generated bundle is 796,842 bytes with SHA-256:

```text
7fcf9ba94f951253041d6c5f191fcf200fccfdb5c706bb8dbcd93b72c335b05a
```

The large generated diff also refreshes previously stale symbols and schematic
layout code from existing nP source. The new hand-maintained runtime change is
the restricted entry's three additional exports. The existing release tag and
published npm package are not moved or replaced by this follow-up.

## Worker calculations and host drawing

The schematic implementation already separates layout and SVG text generation
from browser mounting. The restricted entry now explicitly exports the three
existing helpers:

| Function | Returns | Browser access during generation |
| --- | --- | --- |
| `schematicSvg(network, options)` | A complete SVG string with embedded canonical symbols | None |
| `schematicGraph(network, options)` | The drawing graph, including placements and wire paths | None |
| `schematicTopology(network, options)` | The electrical connection summary | None |

All three use the same layout, shape detection, ORI, options, and symbol data as
the normal schematic renderer. They do not call `schematic()`, mount elements,
create a toolbar, copy to the clipboard, measure with canvas, or rasterize a PNG.
For example, in a host that exposes the restricted namespace as `nP`:

```js
// Generate schematic text and data in an isolated worker
nP.global.fList = [2e9];
var r1 = nP.R(25);
var r2 = nP.R(50);
var network = nP.nodal(
    [r1, 1, 2],
    [r2, 2, 3],
    ['out', 1, 3]
);

var svgText = nP.schematicSvg(network);
var drawingGraph = nP.schematicGraph(network);
var electricalTopology = nP.schematicTopology(network);
```

These are additional exports of the **restricted entry**. The normal public
entry continues to expose `nP.schematic()`; its exports and published npm package
are unchanged. Each pure helper performs its own layout calculation. These
helpers throw on invalid input, so the worker should catch errors and send its
ordinary error message rather than attempting a DOM error display.

The bundle retains `lineChart`, `lineTable`, `smithChart`, `log`, and `schematic`
for the host's controlled rendering side. They still need browser capabilities
when invoked. **The restricted bundle is not a sandbox and is not entirely
DOM-free.** Its worker-safe SVG generation path is the three helpers above.

## Integration still belongs in the Obsidian repository

At audit time, `np-rf-analysis/src/npjs-worker.ts` imports the pinned vendor module
and replaces the three chart calls with message proxies. Its protocol accepts
chart/table render requests and text; it does not yet define schematic SVG
transport. Its saved global settings cover `fList`, `Ro`, and `Temp`, so adoption
of time grids and independent contexts also needs review there.

A separate plugin update must intentionally copy this generated bundle into
`vendor/nP.esm.js`, update its TypeScript declarations, and decide how to expose
schematic drawing in `npjs`. The worker can calculate SVG with `schematicSvg()`
and send text/data through an explicitly validated protocol. The host must
validate/sanitize the received SVG and render it through its approved APIs;
worker-generated text must not be inserted as unrestricted HTML. Resource limits,
error handling, snapshot/PDF behavior, and worker termination remain the host's
responsibility. Merely copying the module does not add a visible schematic
renderer to an installed plugin.

## Exact exports

The resulting ES module has **79 named exports**, in alphabetical order:

```text
Amp Attn C Coupler180 FFT L Load Open PN R Shift90 Short Tclin Tee Tee4
Tee5 Thru Tlin bitErrorRate cascade chebyLPLCs chebyLPNsec chebyLPgk
complex demod dim diode1N4148 dup global invFFT lineChart lineTable log
lpfGen matrix mbend mclin mcross mlin mod mstep mtee mtfr mvgnd mvia
nodal paC paL paPaLC paPaRC paPaRL paPaRLC paR paSeLC paSeRC paSeRL
paSeRLC schematic schematicGraph schematicSvg schematicTopology seC seL
sePaLC sePaRC sePaRL sePaRLC seR seSeLC seSeRC seSeRL seSeRLC seriesTee
smithChart trf trf4Port trfAuto version waveform
```

The digital exports are `PN`, `waveform`, `mod`, `demod`, and `bitErrorRate`;
the sampled-transform exports are `FFT` and `invFFT`. `global` includes `tList`,
`tGen()`, and independent-context selection. Tests exercise these APIs from the
generated bundle rather than merely checking their names.

The `np-misc` package is still excluded. These legacy helpers are absent:
`bodyWidth`, `callCodemirror`, `editor`, `getCircuitTitle`, `run`, and `runButton`.

## Security-sensitive patterns in the generated artifact

The audit scans the generated JavaScript, not the test harness or documentation.
The following patterns have **zero matches**:

- `eval(...)` and dynamic `Function(...)` construction;
- script-element creation and the old `newScript.innerHTML` injection helper;
- executable imports, including dynamic `import(...)`, `importScripts(...)`,
  external module imports/re-exports, and `require(...)`;
- `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, and `WebTransport`;
- constructing `Worker` or `SharedWorker`;
- `localStorage`, `sessionStorage`, and `indexedDB` access.

Retained browser functionality is visible in the artifact. These are literal
text counts for this build, not runtime call counts or a proof of safety:

| Pattern | Count | Why retained |
| --- | ---: | --- |
| Word `document` | 50 | D3, host charts, logging, and schematic mounting |
| Word `window` | 13 | D3 feature detection and host browser helpers |
| Word `navigator` | 11 | Clipboard support in host display functions |
| `.innerHTML` | 6 | Four generic D3 HTML operations, schematic SVG insertion, and constant toolbar icon markup |
| Word `canvas` | 37 | Host label measurement and PNG conversion |
| Word `clipboard` | 14 | Host copy controls and related text |
| `new Image(...)` | 4 | PNG conversion for chart, Smith chart, table, and schematic |
| `new ClipboardItem(...)` | 4 | Those PNG-copy controls |
| `new Blob(...)` | 4 | SVG-to-PNG conversion |
| `new XMLSerializer(...)` | 4 | SVG-to-PNG conversion |
| `URL.createObjectURL(...)` | 4 | Local SVG image blobs, without remote fetching |
| `new ResizeObserver(...)` | 1 | Schematic fit control |

The two schematic `.innerHTML` assignments are in the DOM mounting function;
`schematicSvg()` does not execute them. SVG label text is XML-escaped and symbols
come from the bundled canonical library. This does not replace host-side SVG
validation or enforce an execution sandbox. The host must continue blocking
network, storage, dynamic code, and other disallowed APIs in its worker.

## Verification

Run the build before checking the generated artifact:

```sh
npm run build:plugin
node --loader ./scripts/extensionless-loader.mjs --test test/plugin-entry.test.js test/plugin-bundle.test.js
npm test
```

The restricted-entry tests compare exact source and bundle exports and require
the bundle version to match `package.json`. They check prohibited patterns and
run the actual ES module in a separate Node worker. After module import,
throwing getters block DOM, clipboard/browser globals, canvas-related APIs,
network, and storage during schematic and digital calculations. The worker
returns its SVG strings, graph, and topology through `postMessage`, verifying
that these results can cross a structured-clone boundary.

Coverage includes cascades, nodal circuits with nonsequential node numbers and
component reuse, grouped ladder layout, signal paths, XML escaping, invalid
inputs, PN generation, waveform sampling, FFT/dBV/inverse FFT, bit modulation,
demodulation, and BER. Node's test harness uses a trusted worker bootstrap;
that bootstrap is not part of the restricted artifact and is not a sandbox for
untrusted code.

This audit also ran the generated ES module in a Firefox module worker, where
`document` was absent during import. With browser, network, and storage globals
then blocked, SVG/graph/topology crossed the worker message boundary and the
FFT/inverse FFT and mod/demod/BER checks passed. This verifies the generation
path in a browser worker; it does not test an installed Obsidian plugin or add
its missing schematic message adapter.

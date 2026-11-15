<!-- Modified: 2026-11-14 -->
# Restricted nP 0.49.0 plugin bundle audit

The restricted build starts at `src/plugin.js` and produces
`dist/nP.plugin.esm.js` with `npm run build:plugin`. It reports `0.49.0` and
includes the current RF, math, global, chart, schematic, and digital APIs.
The restricted helper exports were added separately from the main npm entry.
The November 13–14 node-marker updates refresh the main and restricted bundles
together. The separately maintained Obsidian plugin repository is not changed
by this refresh.

## Source provenance

The original restricted-entry update was committed as
`ab8bd664e0d49927e752612dd5d2b17f5cecc124`, after the existing `v0.49.0` tag at
`e711e354aeef6d559aba409b4268bebce7e43219`. The library version remains `0.49.0`.
The November 13 refresh removes misleading per-wire-box `nodeDot` records;
`graph.nodes` remains the authority for numbered marker coordinates. Actual
wire junctions are drawn from connectivity rather than the number of bends.
The same refresh adds metadata-based junction divider/combiner layout through
ORI; it adds no public exports or browser capabilities.
Record the source commit and artifact checksum when promoting any refreshed
bundle to the Obsidian repository; the version string alone does not identify
these post-release builds.

The November 14 update finalizes cornered-connection markers on the incoming
wire before the first corner, with shared crossing/terminal clearance and
deterministic branching rules. Straight connections retain their markers.
This finishing step is DOM-free and introduces no public exports.

The same day's symbol refresh bundles six canonical source drawings (`V`, `I`,
`VCVS`, `VCCS`, `CCVS`, `CCCS`). They are artwork registrations rather than
executable source constructors and introduce no public exports or capabilities.

The authoring-language update adds the `{paths, annotations}` input route to
the shared schematic helpers. Its parser selects catalog geometry without
executing constructors or caption expressions. Constraint layout, SVG labels,
arrows and rectangle generation stay DOM-free. The mounted API also returns
`svgText` and provides Save SVG; its local Blob URL and download-link operations
run only when the browser control is clicked. Named module exports remain unchanged.

The generated bundle is 861,871 bytes with SHA-256:

```text
935e0791c650fdb2b0b02d0e1614eec99c009f961f9613e2f94481a1076386c8
```

The original helper-export commit also refreshed previously stale symbols and
schematic layout code. The existing release tag and published npm package are
not moved or replaced by subsequent local bundle refreshes.

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

At the original November 9 audit, `np-rf-analysis/src/npjs-worker.ts` imported the pinned vendor module
and replaced the three chart calls with message proxies. Its protocol accepted
chart/table render requests and text; it did not yet define schematic SVG
transport. Its saved global settings covered `fList`, `Ro`, and `Temp`, so adoption
of time grids and independent contexts also needed review there. These are
historical observations; subsequent Obsidian integration was completed in its
own repository. A local nP rebuild does not update that pinned copy automatically.

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
| Word `document` | 52 | D3, host charts, logging, schematic mounting, and the SVG download link |
| Word `window` | 13 | D3 feature detection and host browser helpers |
| Word `navigator` | 11 | Clipboard support in host display functions |
| `.innerHTML` | 6 | Four generic D3 HTML operations, schematic SVG insertion, and constant toolbar icon markup |
| Word `canvas` | 37 | Host label measurement and PNG conversion |
| Word `clipboard` | 14 | Host copy controls and related text |
| `new Image(...)` | 4 | PNG conversion for chart, Smith chart, table, and schematic |
| `new ClipboardItem(...)` | 4 | Those PNG-copy controls |
| `new Blob(...)` | 5 | SVG-to-PNG conversion and the local SVG download |
| `new XMLSerializer(...)` | 4 | SVG-to-PNG conversion |
| `URL.createObjectURL(...)` | 5 | Local SVG image/download blobs, without remote fetching |
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
component reuse, grouped ladder layout, junction-divider graphs and reflected
combiner SVG, authored source/DUT paths with arrows/rectangle/reference ports, signal paths, XML escaping, invalid
inputs, PN generation, waveform sampling, FFT/dBV/inverse FFT, bit modulation,
demodulation, and BER. The generated worker graph must have unique node IDs and
no per-box `nodeDot` records. Node's test harness uses a trusted worker bootstrap;
that bootstrap is not part of the restricted artifact and is not a sandbox for
untrusted code.

This audit also ran the generated ES module in a Firefox module worker, where
`document` was absent during import. With browser, network, and storage globals
then blocked, SVG/graph/topology crossed the worker message boundary and the
FFT/inverse FFT and mod/demod/BER checks passed. This verifies the generation
path in a browser worker; it does not test an installed Obsidian plugin or test
its host's schematic message adapter.

The authoring refresh additionally exercised a source/DUT drawing with a
controlled set of arrows and an enclosing rectangle in a Firefox module worker.
SVG text and the structured-cloneable graph returned with DOM, clipboard,
canvas-related and network APIs blocked. The normal Firefox harness also
verified that Save SVG downloads exactly the returned `svgText`.

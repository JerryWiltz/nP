<!-- Modified: 2026-11-18 -->
# Restricted nP 0.49.0 plugin bundle audit

The restricted build starts at `src/plugin.js` and produces
`dist/nP.plugin.esm.js` with `npm run build:plugin`. It reports `0.49.0` and
includes the current RF, math, global, chart, schematic, and digital APIs.
The restricted helper exports were added separately from the main npm entry.
The November 13–14 node-marker updates refresh the main and restricted bundles
together. The separately maintained Obsidian plugin repository is not changed
by this refresh.

## Source provenance

The November 18 update makes `lpfGen()` preserve caller-owned arrays, including
frozen arrays, and reject malformed ladders or nonpositive/nonfinite values
before component construction. Errors identify the invalid entry and electrical
role. The ideal noise, intermodulation propagation and retained DC topology are
unchanged. Regression coverage includes repeated construction, input errors,
source-noise propagation, product-frequency attenuation and a solved DC load.
This update introduces no exports or browser capabilities.

The November 16 update adds `V()` for a floating DC supply represented as a two-port nPort. DC analysis reuses connections retained by the existing `nodal()`, `cas()` and `cascade()` APIs. Constructors and composed networks preserve validated DC descriptors; `network.solveDC()` now solves the supported linear DC models and returns transferable immutable voltage/current results. NPN/PNP nonlinear DC solving was added in the following update. The selected `V()` model is through at 0 Hz, open at positive frequencies, and explicitly noiseless. Its DC voltage constraint is separate from the incremental S data. `V` moves from drawing-only registration to the public constructor catalog. Coverage includes the solved 5.714286 mA resistorDC two-port, retained topology/source data and SVG generation with browser/network globals blocked; no browser capabilities are added.

The November 17 update adds the internal NPN/PNP operating-point handoff and RF construction recipes. Independently biased placements rebuild their S/noise/nonlinear data and enclosing nodal/cascade networks without mutating templates. RF input excitations are replayed through the updated response. The restricted-worker test exercises the handoff with browser/network APIs blocked and transfers plain result data. The same update adds NPN/PNP nonlinear network solving and automatic DC-before-RF execution for networks with explicit voltage supplies. The restricted worker solves a divider-biased amplifier and checks its node/device operating point and RF response. Diode network DC adapters remain unsupported.

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

The November 15 transistor update adds the executable `NPN()` constructor for
2N3904 (default) and BFR93A. Its canonical NPN artwork moves from the catalog's
`deviceSymbols` registry to `constructors`. The shared device engine calculates
DC curves, fixed-Q three-port S/noise data, and direct weak nonlinear sources;
two-ports also expose computed K and delta magnitude. This adds one public
export, `NPN`, and no browser capabilities. Tests exercise NPN curves, RF,
noise, stability and SVG generation with browser/network globals blocked.

The transistor layout correction adds symbol-level automatic orientation
preferences and shared local-termination placement in ORI's generic board.
Numbered transistor terminals remain fixed, attached one-ports follow the
canonical lead direction, and external ports follow signal flow. Explicit
drawing-language rotations remain available. This changes only DOM-free layout
and adds no exports or browser capabilities.

The same day's PNP update adds `PNP()` with the Fairchild 2N3906 parameter card,
an inward-arrow canonical symbol and signed PNP DC defaults. NPN/PNP share the
constructor, SPICE defaults, current/charge equations, RF and noise engine.
Polarity conversion also transforms the even-order nonlinear coefficients.
Worker tests calculate PNP curves, fixed-Q RF/noise/stability and a complete
schematic with DOM/browser/network APIs blocked. This adds only the `PNP`
export and no new browser capabilities.

The same day's diode update adds `D()` with the archived NXP 1N4148 card.
It separates the DC sweep from a fixed RF Q point, generates correlated noise
and direct weak nonlinear sources, and shares the existing canonical diode
symbol with `diode1N4148()`. The latter retains its older parameters and API.
The junction-temperature helper is shared with BJT models. Worker tests cover
D curves, fixed-Q RF/noise and DOM-free SVG generation. This adds only the `D`
export; the security-sensitive literal counts below are unchanged.

The November 18 generated bundle is 977,948 bytes with SHA-256:

```text
f7d53c8b879d2a577359bc28ab609e17c6e0e91c79af48f89adef6ed6b12dd90
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
entry continues to expose `nP.schematic()`; the November 15 NPN, PNP and D additions are shared
by both entries. The published npm package remains unchanged until released.
Each pure helper performs its own layout calculation. These
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

The resulting ES module has **82 named exports**, in alphabetical order:

```text
Amp Attn C Coupler180 D FFT L Load NPN Open PN PNP R Shift90 Short Tclin Tee Tee4
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
inputs, NPN/PNP DC curves and fixed-Q RF/noise/stability, D diode curves/RF/noise/SVG, PN generation, waveform
sampling, FFT/dBV/inverse FFT, bit modulation, demodulation, and BER.
The generated worker graph must have unique node IDs and
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

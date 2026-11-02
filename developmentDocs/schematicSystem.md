<!-- Modified: 2026-11-01 -->
# Schematic system

## Overview

nP has two related schematic workflows. The authoring workflow turns editable circuit descriptions into self-contained SVG files for the documentation site. The runtime workflow lets browser code call `nP.schematic(circuit)` for an nPort or `nP.schematic({transmitter, circuit, receiver})` for a simple signal path. Both describe the same electrical ideas, but they currently use different layout engines.

The schematic is a view of how components are connected. It does not calculate S-parameters or change the circuit. The RF constructors, `cas()`/`cascade()`, and `nodal()` build the nPort and record the information the runtime renderer needs. `schematic.js` reads that information, chooses positions and orientations, then draws SVG.

## Sources of truth and generated artifacts

The **59 individual SVG files in [`schematics/symbols/`](../schematics/symbols/)** are the source of truth for canonical symbol geometry. They live at one directory level. [`schematics/symbol-catalog.json`](../schematics/symbol-catalog.json) maps public constructor names to those files, records the alternate `mbend()` drawing, and identifies the signal-flow symbols. [`schematics/svg-style-guide.md`](../schematics/svg-style-guide.md) specifies the grid, port order, colors, dimensions, and labeling rules.

The authoring tools read the canonical SVG files directly:

| Output | Source and process |
| --- | --- |
| [`dev/canonicalSymbols.html`](../dev/canonicalSymbols.html) | `symbol-gallery.template.html` fixes gallery order; `generate-symbol-gallery.js` embeds the canonical symbol bodies. |
| [`docs/public/schematics/`](../docs/public/schematics/) | Circuit descriptions in `schematics/circuits/*.json` name canonical symbols, ports, nodes, wires, and positions. `compose-schematic.js` embeds the canonical geometry and description into each finished SVG. |

These published SVGs are independent documentation assets. The REPL no longer displays its old static schematic gallery; runnable nPort examples call `nP.schematic(...)` inside their code.

[`src/np-chart/src/schematicSymbols.js`](../src/np-chart/src/schematicSymbols.js) is generated from the canonical SVGs. [`schematics/runtime-symbol-layout.json`](../schematics/runtime-symbol-layout.json) keeps only the extra placement data that an SVG does not state: body and ink bounds, lead segments, and flow directions. `generate-runtime-symbols.js` parses the canonical geometry and numbered port dots, validates the layout data against those ports, and writes the bundled module. The runtime bundle contains all RF component symbols, plus cascade, nodal, MOD, and DEMOD symbols. Signal-processing symbols that do not represent RF nPorts remain in the canonical library for authoring. `symbols:check` fails if this generated module is stale.

## How the runtime code reaches distributions

The import chain is:

```text
schematicSymbols.js → schematic.js → src/np-chart/index.js → src/index.js
```

The same symbol-generation command writes `src/np-nport/src/schematicSymbolMap.js` from `schematics/symbol-catalog.json`. Each direct RF constructor calls `schematicPart(publicName, parameters)`; that helper reads the generated map, so constructor source does not repeat the SVG filename. The catalog gives `mbend()` explicit `left` and `right` variant keys. `symbols:check` and both Rollup builds instantiate all 50 direct RF constructors and compare each returned nPort's port count and symbol ID with the runtime symbol. `lpfGen()` inherits its cascade metadata from `paC()` and `seL()`.

`npm run build` regenerates `schematicSymbols.js`, then runs Rollup from `src/index.js` and writes three tracked distributions:

| File | Format and use |
| --- | --- |
| `dist/nP.js` | UMD browser bundle; exposes the global `nP` object. |
| `dist/nP.esm.js` | ES module package import. |
| `dist/nP.cjs` | CommonJS package import. |

Because these bundles include `schematic.js` and `schematicSymbols.js`, the browser does not fetch canonical SVG files when `nP.schematic()` runs. The REPL loads a copy of `dist/nP.js` at `docs/public/nP.js`; that copy must be refreshed after browser behavior changes. The separate `src/plugin.js` entry point also re-exports `np-chart`, so `npm run build:plugin` can build the schematic API into `dist/nP.plugin.esm.js` when that separately maintained bundle is updated. The npm package's declared public files are the three main `dist/nP.*` bundles, not the canonical SVG directory or the plugin bundle.

## Public API and source-module functions

Only `schematic` is exported through `src/np-chart/index.js` as `nP.schematic`. The other three functions below are exported by `schematic.js` for direct source-module use; they are **not** `nP.schematicGraph`, `nP.schematicTopology`, or `nP.schematicSvg`.

| Function | Result |
| --- | --- |
| `nP.schematic(circuit, options)` | Builds the RF circuit model, mounts an SVG and controls, and returns `{svg, graph, topology}`. `svg` is the mounted DOM element. |
| `nP.schematic({transmitter, circuit, receiver}, options)` | Draws a two-port RF cascade between MOD and DEMOD blocks. `receiver` may be omitted when the displayed path ends at the RF circuit. |
| `schematicGraph(circuit, options)` | Returns the computed drawing graph without mounting it. |
| `schematicTopology(circuit, options)` | Returns the parts and electrical connections without mounting a drawing. |
| `schematicSvg(circuit, options)` | Returns the SVG markup string without mounting it. |

`schematic()` mounts to `document.body` by default. `options.mount` may be a CSS selector or an element, and `options.containerId` names its wrapper. The default `view: 'detail'` expands a cascade into its components. `view: 'blocks'` can show completed cascade operands as reusable two-port blocks; nodal drawings currently support only the detail view. The returned `graph` and `topology` are plain serializable objects. Changing them after the call does not redraw the SVG or alter the nPort.

Schematic labels use three significant digits by default. `options.significantDigits` accepts an integer from 1 to 15. The formatter changes only label text; component values in `graph` and `topology` retain the constructor's full numeric value.

For example, after constructing `lowPass` with `nP.nodal(...)`:

```js
var drawing = nP.schematic(lowPass);
var placedObjects = drawing.graph;
var connections = drawing.topology;
```

The REPL calls `nP.schematic(circuit)` in its output iframe, alongside chart and table calls. The SVG opens at one CSS pixel per drawing unit, so symbol size stays consistent as circuits grow. Its viewport grows to the drawing's full height and scrolls horizontally when needed. **Fit drawing** scales the drawing to the available width and changes to **Actual size** to restore the default scale. Copying a PNG uses the SVG's full drawing dimensions, independent of the current display scale.

## Network-only renderer and shape guidance

`nP.schematic(circuit)` reads the nPort's `_schematic` construction data and canonical symbols. Its path, tree, loop, parallel-path, and general node-routing layouts use those electrical connections. The 32 circuits in [`dev/schematic.html`](../dev/schematic.html) exercise network-only and guided behavior. The optional `shapes: ['series']`, `shapes: ['ladder']`, or `shapes: ['branchline']` checks one engineering layout intent. A two-entry array of `{name, from, to}` sections can guide a series section followed by a ladder in one nodal network, with the series `to` equal to the ladder `from`. The renderer traces the actual connections and rejects boundaries or sections that do not match. See [`schematicShapeVocabulary.md`](schematicShapeVocabulary.md) for the shape definitions and examples.

For line-based ladders, a runtime symbol may declare its through and shunt port numbers in `schematics/runtime-symbol-layout.json`. Both `Tee()` and `mtee()` use ports 2 and 3 for the main path and port 1 for the shunt. The flow layout tests 90-degree rotations and reflections against the actual port coordinates, choosing one that advances the main path rightward and points the shunt downward. Two-port parts such as `Tlin()` and `mlin()` are oriented by their input and output ports. A one-port termination is oriented from its port toward its body, so `Short()`, `Open()`, and the physical microstrip `mvgnd()` can sit at the bottom of a shunt without a constructor-specific angle.

For a guided branchline, the renderer contracts each chain of two-port arm components into an edge between three-port junctions. It traces the upper and lower rows from the four external corners and checks that every neighboring pair is linked by a vertical arm. Every component and edge must belong to that rectangular chain. The count of columns gives the cell count; a one-cell ring has one independent cycle, while adjacent cells add cycles. The layout places junctions on a rectangular grid, distributes the actual arm components along each edge, and chooses each symbol's 90-degree rotation or reflection from its connected port directions. The graph reports `layout: 'branchline'`, `shape: 'branchline'`, and `cells`. This uses the same canonical symbols as the rest of the renderer and does not depend on a component-name pattern.

The printable previews in [`schematics/shapes/previews/`](../schematics/shapes/previews/) remain visual references. The old `seriesOf2Ports` and `ladder` JSON files were retired; their layout rules now live in `schematic.js`. The remaining `splitRejoin` JSON is an experimental design reference and is not loaded by the runtime renderer.

Signal-path drawings require the transmitter and receiver to be passed explicitly because the nPort's RF construction metadata does not know which downstream receiver was created. MOD and DEMOD connectors represent functional signal flow; they are not nPort S-parameter ports. The RF circuit between them retains its usual component metadata and numeric behavior.

The main internal functions in `schematic.js` divide the work as follows:

| Internal function or group | Job |
| --- | --- |
| `buildSchematicModel()` | Selects a cascade or nodal model from `circuit._schematic`. |
| `buildFlowNodalModel()` | Find a main path and place simple terminating shunt chains from network connections. |
| `flattenCascade()`, `blockViewTree()`, `placeComponents()` | Select and position detailed parts or reusable cascade blocks. |
| `annotateLayout()`, `layoutViewBox()` | Place cascade labels and node numbers clear of symbol ink, then size the canvas. |
| `buildNodalModel()` | Select a network-only nodal layout from the detected connections. |
| `findFlowPath()`, `buildFlowNodalModel()` | Trace a two-port main path and place simple shunt branches from their node assignments. |
| `nodalTree()`, `buildTreeNodalModel()` | Derive a component tree from shared nodes, place its longest path horizontally, and place remaining branches from their actual component ports. |
| `nodalLoopAnalysis()`, `buildSingleLoopNodalModel()` | Detect cycles and place a single closed path using its actual component ports. |
| `buildParallelNodalModel()`, `buildJunctionPathsNodalModel()` | Place parallel two-port branches or multiple paths between junctions. |
| `buildGraphNodalModel()` | Place and route remaining networks directly from component-node connections. |
| `renderSchematicSvg()`, `renderNodalSvg()` | Convert placed symbols, wires, labels, and ports into SVG markup. |
| `schematicPngBlob()`, `copySchematicPng()` | Rasterize the mounted SVG and write its PNG to the browser clipboard. |

## Connection theory and layout

An RF circuit has **components, ports, and electrical nodes**. A supported constructor supplies a component with ordered ports and attaches a `_schematic` record naming its drawing symbol and relevant values. A node number in `nodal()` identifies one electrical connection shared by every listed port with that number. This is a connectivity statement, not a coordinate. Several ports can share one node even if their symbols are drawn far apart.

The renderer keeps two models separate:

- **Topology** records which component ports share each node or which cascaded ports connect. For nodal circuits, a node can join more than two ports. For cascades, the binary construction tree records how intermediate nPorts were assembled.
- **Drawing graph** assigns coordinates, rotations, wires, labels, node circles, and a `viewBox` to a selected visual layout of that topology. Different drawings can represent the same topology.

`nPort.cas()` records `{kind: 'cascade', left, right}` using the two operands' metadata. `nP.cascade()` builds through `cas()` and preserves the tree. `nP.nodal()` records its component entries as `{part, nodes}` and stores the external node order. This metadata travels with the returned nPort; the renderer does not infer a circuit from its numeric S matrix. Reusing one component object in separate connections creates separate placements with the same part metadata.

For a nodal network, `topology.loopAnalysis` describes cycles in the actual connections. The detector treats each component row and each electrical node as a vertex, with one edge for every numbered component port; external ports do not add edges. It builds a spanning forest and reports each `closingEdges` entry that connects vertices already joined. `cycles` lists the tree path plus that closing edge for each independent cycle. An edge is `{component, port, node}`: `component` is the one-based position of the component row in `nodal()`, and `port` is the component's one-based port number. `hasLoops` is true when any closing edge exists. The renderer uses this analysis to select a closed-loop or parallel-branch layout when the connections fit those general arrangements.

For a cascade, `schematic.js` walks the construction tree, optionally replaces completed subtrees with `cascade` block symbols, and lays out the resulting two-port parts in order. Each symbol has port coordinates, an exit direction, body and ink bounds, and SVG geometry. The renderer rotates by 90-degree steps, advances from one output port to the next input port, and checks for body and wire collisions. It then chooses positions for component labels and circled node numbers, computes a viewBox, and emits the SVG. The layout uses a shared 20-unit coordinate grid.

When a completed `nodal()` nPort is connected as one part of a larger nodal circuit, it appears as a `nodal` block. The canonical SVG is the two-port reference. `nodalBlockSymbol()` generates the same rectangular form for other port counts, with 20-unit leads and stable port numbering; its geometry can put individual ports on any of the four sides. The current automatic layout starts with port 1 on the left and the remaining ports on the right, then may rotate or reflect the whole block. The nested circuit's full `_schematic` connection record remains available. A top-level nodal circuit still expands to its component drawing.

For a nodal network, the renderer first analyzes the connections for cycles. Parallel two-port components between the same external nodes are placed in rows between shared left and right junction wires. Two multiport junctions joined by several one-component paths use stacked lanes. When one cycle uses every component, the renderer orders those components around a closed path, rotates or mirrors junction symbols to face their connected neighbors, and routes the numbered nodes between them. These rules use connection structure rather than constructor names or a named circuit pattern. Other cyclic networks use the general node-routing fallback.

For networks without loops, the renderer searches for a two-port path from external port 1 to external port 2. If that path has simple shunt branches, it places the main path horizontally and the branches vertically, following the actual port-to-node assignments. The RC low-pass circuit uses this layout: resistor and tee on the main path, capacitor and short on the shunt. For other tree-shaped multiport circuits, it derives component links from shared nodes, finds the longest path from the first external port, and places that path horizontally. Other components attach as branches at their actual numbered ports. External wires leave each symbol in the outward direction of its terminal, keeping adjacent ports separate. Node dots are placed on routed wire segments; labels and node numbers are placed with collision checks. The VNA circuits and the three-port tee divider use this general tree layout. When a network does not fit these layouts, the fallback places components in graph-distance layers and routes each electrical node directly among its terminals. Routing stays on the 20-unit grid and avoids symbol bodies and other terminals; crossings between different nodes show a visible gap.

Finally, `renderSchematicSvg()` draws the chosen model as self-contained SVG. The mounted API adds the clipboard button, which rasterizes the SVG to PNG in the browser. Neither rendering nor copying affects the RF calculation.

## Boundaries and checks

`nP.schematic()` requires drawing metadata and a symbol bundled in `schematicSymbols.js`. Its signal-path form currently accepts a two-port RF component or cascade between a transmitter and an optional receiver. Other signal-flow blocks such as `FFT()` are canonical SVGs but do not yet have runtime layout support. The authoring composer handles broader signal-flow diagrams separately using named signal connections rather than RF node numbers.

The [network-only development harness](../dev/schematic.html) draws 29 direct and stress circuits through the public API. Its `dev/schematicStressCases.js` cases include loops and other nodal arrangements that exercise the general node router.

Useful checks are `npm run symbols:gallery`, `npm run symbols:bundle`, `npm run symbols:check`, `npm run schematics:build`, and `npm run schematics:check`. `npm run build` is needed after changing runtime symbol data or `schematic.js`; it regenerates the symbol module and must be followed by copying the browser bundle to `docs/public/nP.js` for the REPL. Visual inspection remains necessary for spacing, labels, and clarity even when structural checks pass.

<!-- Modified: 2026-11-03 -->
# Schematic system

## Overview: drawing two series resistors

This example shows the main runtime workflow: create an RF network with `nodal()`, then call `nP.schematic()` to draw it. The `series` shape option guides the layout. The frequency list is needed to construct the RF parts; the schematic itself uses their connection metadata and symbol geometry.

```js
var g = nP.global;
g.fList = [2e9];

var r1 = nP.R(50);
var r2 = nP.R(50);
var seriesCircuit = nP.nodal(
    [r1, 1, 2],
    [r2, 2, 3],
    ['out', 1, 3]
);

var drawing = nP.schematic(seriesCircuit, {
    shapes: ['series']
});
```

The constructors attach resistor symbol and value metadata to `r1` and `r2`. `nodal()` records their port-to-node assignments and external nodes `[1, 3]`. The `shapes: ['series']` option asks the renderer to arrange this connection as a left-to-right series path. It guides the drawing without changing the electrical network.


### Layout and render

**Layout** turns the electrical connections into a drawing model. For this example, `buildFlowNodalModel()` chooses each resistor's position and orientation, records the wires between numbered ports, and assigns node and label positions. The resulting `graph` describes those placements and connections; `topology` gives a separate view of the electrical connectivity.

**Render** turns that drawing model into SVG. `renderNodalSvg()` reads the graph and the canonical resistor artwork and draws the symbols, wires, dots, and text. `schematic()` mounts that SVG and adds the toolbar. The returned `drawing.graph` and `drawing.topology` let code inspect the layout and connections alongside the visible `drawing.svg`.

In short, `nodal()` supplies the electrical truth, the `series` functions validate and arrange it, and the render functions draw the result. Symbol artwork and port coordinates come from the generated `schematicSymbols.js`.

### Returned `graph` and `topology`

For the example above, `nP.schematic()` returns an object containing `svg`, `graph`, and `topology`. The `svg` is the mounted SVG element. The other two values are plain JavaScript data objects. Here is the resulting graph (coordinates are schematic units):

```js
graph = {
  kind: 'rf-nodal',
  shape: 'series',
  viewBox: [0, -80, 580, 340],
  components: [
    {
      id: 'R1',
      symbol: 'resistor',
      part: {value: 50, kind: 'component', symbol: 'resistor'},
      rotation: 0,
      mirrorY: false,
      ports: [
        {port: 1, node: 1, at: [120, 100]},
        {port: 2, node: 2, at: [220, 100]}
      ],
      at: [120, 100],
      sourcePort: 1
    },
    {
      id: 'R2',
      symbol: 'resistor',
      part: {value: 50, kind: 'component', symbol: 'resistor'},
      rotation: 0,
      mirrorY: false,
      ports: [
        {port: 1, node: 2, at: [300, 100]},
        {port: 2, node: 3, at: [400, 100]}
      ],
      at: [300, 100],
      sourcePort: 1
    }
  ],
  nodes: [
    {id: 1, at: [80, 100], numberAt: [80, 60]},
    {id: 2, at: [260, 100], numberAt: [260, 60]},
    {id: 3, at: [440, 100], numberAt: [440, 60]}
  ],
  wires: [
    {node: 1, points: [[40, 100], [120, 100]]},
    {node: 2, points: [[220, 100], [300, 100]]},
    {node: 3, points: [[400, 100], [480, 100]]}
  ],
  labels: [
    {text: 'R1 = 50 Ω', at: [170, 10]},
    {text: 'R2 = 50 Ω', at: [350, 10]},
    {text: 'Port 1', at: [40, 160]},
    {text: 'Port 2', at: [480, 160]}
  ],
  externalPorts: [
    {port: 1, node: 1, at: [40, 100]},
    {port: 2, node: 3, at: [480, 100]}
  ]
};
```

The topology stores the same electrical network as node-to-port relationships, without drawing coordinates:

```js
topology = {
  parts: [
    {id: 'R1', type: 'resistor', nodes: [1, 2], value: 50,
      impedance: null, length: null},
    {id: 'R2', type: 'resistor', nodes: [2, 3], value: 50,
      impedance: null, length: null}
  ],
  connections: [
    {node: 1, ports: ['R1.1'], externalPorts: [1]},
    {node: 2, ports: ['R1.2', 'R2.1'], externalPorts: []},
    {node: 3, ports: ['R2.2'], externalPorts: [2]}
  ],
  loopAnalysis: {
    hasLoops: false,
    spanningTree: [
      {component: 1, port: 1, node: 1},
      {component: 1, port: 2, node: 2},
      {component: 2, port: 1, node: 2},
      {component: 2, port: 2, node: 3}
    ],
    closingEdges: [],
    cycles: []
  }
};
```

In the graph, node 2 has a position and a wire segment. In the topology, node 2 says which electrical terminals meet there: `R1.2` and `R2.1`. That distinction lets the graph describe how the circuit is drawn while the topology describes how it is connected.

The runtime then performs these jobs to validate, lay out, render, and mount the example:

<table>
  <thead>
    <tr><th>Job</th><th>Functions</th><th>What they do and why it helps</th></tr>
  </thead>
  <tbody>
    <tr><td rowspan="5">Choose the drawing path</td><td><code>schematic()</code></td><td>Public entry point. It returns the mounted SVG together with the computed graph and topology.</td></tr>
    <tr><td><code>schematicSignificantDigits()</code></td><td>Validates label precision so values are formatted consistently.</td></tr>
    <tr><td><code>buildSchematicModel()</code></td><td>Coordinates model creation from the nPort metadata and options. This keeps the main API independent of each layout's details.</td></tr>
    <tr><td><code>buildNodalModel()</code></td><td>Selects the requested shape layout or a general nodal layout. New layout strategies can be added without changing the SVG drawing routines.</td></tr>
    <tr><td><code>requestedShape()</code></td><td>Validates and normalizes the shape option so later functions receive a known layout request.</td></tr>
    <tr><td rowspan="7">Confirm the circuit fits</td><td><code>shapePath()</code></td><td>Requires a two-port, loop-free network path for the <code>series</code> shape. This prevents the series layout from being applied to a different topology.</td></tr>
    <tr><td><code>nodalLoopAnalysis()</code></td><td>Detects cycles from component ports and shared nodes. The series path check can reject loops using electrical connectivity.</td></tr>
    <tr><td><code>findFlowPath()</code></td><td>Traces a path from external port 1 to port 2 through connected component ports, independent of the order of rows in <code>nodal()</code>.</td></tr>
    <tr><td><code>flowPairs()</code></td><td>Gets valid through-port pairs from symbol geometry. This lets the path finder use a component's port layout rather than constructor-specific rules.</td></tr>
    <tr><td><code>isSeriesShape()</code></td><td>Checks that the traced path accounts for every component, so no branch is silently left out of a series drawing.</td></tr>
    <tr><td><code>isSeriesPath()</code></td><td>Confirms each component on the candidate path is a two-port symbol.</td></tr>
    <tr><td><code>symbolForSchematicEntry()</code><br>(Outside schematic.js)</td><td>Defined in <a href="../src/np-chart/src/nodalBlockSymbol.js"><code>nodalBlockSymbol.js</code></a>. Resolves an nPort entry to its bundled symbol and port geometry, including generated nodal-block geometry when needed.</td></tr>
    <tr><td rowspan="7">Place parts and wires</td><td><code>buildFlowNodalModel()</code></td><td>Assigns component, wire, node, label, and external-port positions. It produces the graph and topology used by later steps.</td></tr>
    <tr><td><code>flowPartId()</code></td><td>Creates visible IDs such as <code>R1</code> and <code>R2</code> from component types, keeping the drawing labels consistent.</td></tr>
    <tr><td><code>orientedFlowPlacement()</code></td><td>Tries allowed rotations and reflections until the connected ports follow the requested direction. This preserves actual port connections while making the path flow rightward.</td></tr>
    <tr><td><code>nodalPlacement()</code></td><td>Builds a placed component record, mapping each numbered port to its node and drawing coordinate.</td></tr>
    <tr><td><code>transformedPoint()</code></td><td>Converts a canonical symbol coordinate to its location after placement and rotation.</td></tr>
    <tr><td><code>rotateVector()</code></td><td>Applies quarter-turn rotations to symbol port geometry, matching the schematic's 90-degree rotation rule.</td></tr>
    <tr><td><code>nodalPath()</code></td><td>Stores a wire as drawing points tagged with its electrical node ID, preserving connectivity in the graph.</td></tr>
    <tr><td rowspan="2">Return useful circuit information</td><td><code>componentLabel()</code></td><td>Formats a visible label from component metadata, such as <code>R1 = 50 Ω</code>.</td></tr>
    <tr><td><code>flowTopology()</code></td><td>Groups component ports by node and reports loop analysis. This gives code an inspectable electrical connection list apart from the drawing.</td></tr>
    <tr><td rowspan="5">Render and mount</td><td><code>renderSchematicSvg()</code></td><td>Chooses the SVG renderer for the computed model type, keeping layout selection separate from drawing markup.</td></tr>
    <tr><td><code>renderNodalSvg()</code></td><td>Draws placed symbols, wires, nodes, ports, and labels from the graph. It uses canonical symbol geometry rather than redrawing component symbols.</td></tr>
    <tr><td><code>escapeXml()</code></td><td>Escapes label text for SVG markup, keeping the generated XML valid.</td></tr>
    <tr><td><code>sizeSchematicSvg()</code></td><td>Sets the displayed SVG dimensions from its viewBox and scale so the drawing can show at actual size or fit the viewport.</td></tr>
    <tr><td><code>styleSchematicButton()</code></td><td>Applies consistent styling to the fit and copy controls.</td></tr>
    <tr><td rowspan="4">Respond to toolbar actions</td><td><code>toggleSchematicFit()</code></td><td>Switches between actual-size and fitted display when the user clicks the fit control.</td></tr>
    <tr><td><code>updateFittedSchematic()</code></td><td>Recalculates the fit scale when the viewport resizes, keeping the full drawing visible.</td></tr>
    <tr><td><code>copySchematicPng()</code></td><td>Copies the rendered schematic as a PNG to the clipboard when requested.</td></tr>
    <tr><td><code>schematicPngBlob()</code></td><td>Converts the SVG into a PNG blob for clipboard export.</td></tr>
  </tbody>
</table>

## Two schematic workflows

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

`nP.schematic(circuit)` reads the nPort's `_schematic` construction data and canonical symbols. Its path, tree, loop, parallel-path, and general node-routing layouts use those electrical connections. The 32 circuits in [`dev/schematic.html`](../dev/schematic.html) exercise network-only and guided behavior. The optional `shapes: ['series']`, `shapes: ['ladder']`, or `shapes: ['branchline']` checks one engineering layout intent. A two-entry array of `{name, from, to}` sections can guide a series section followed by a ladder in one nodal network, with the series `to` equal to the ladder `from`. The renderer traces the actual connections and rejects boundaries or sections that do not match. See [`schematicShapeVocabulary.md`](schematicShapeVocabulary.md) for the shape definitions and examples. Standalone shape harnesses are under [`dev/shapes/`](../dev/shapes/), including the [branchline examples](../dev/shapes/branchline.html).

For line-based ladders, a runtime symbol may declare its through and shunt port numbers in `schematics/runtime-symbol-layout.json`. Both `Tee()` and `mtee()` use ports 2 and 3 for the main path and port 1 for the shunt. The flow layout tests 90-degree rotations and reflections against the actual port coordinates, choosing one that advances the main path rightward and points the shunt downward. Two-port parts such as `Tlin()` and `mlin()` are oriented by their input and output ports. A one-port termination is oriented from its port toward its body, so `Short()`, `Open()`, and the physical microstrip `mvgnd()` can sit at the bottom of a shunt without a constructor-specific angle.

For a guided branchline, the renderer contracts each chain of two-port arm components into an edge between three-port junctions. It traces the upper and lower rows from the four external corners and checks that every neighboring pair is linked by a vertical arm. Every component and edge must belong to that rectangular chain. The count of columns gives the cell count; a one-cell ring has one independent cycle, while adjacent cells add cycles. The layout places junctions on a rectangular grid, distributes the actual arm components along each edge, and chooses each symbol's 90-degree rotation or reflection from its connected port directions. The graph reports `layout: 'branchline'`, `shape: 'branchline'`, and `cells`. This uses the same canonical symbols as the rest of the renderer and does not depend on a component-name pattern.

The printable previews in [`schematics/shapes/previews/`](../schematics/shapes/previews/) are visual references. Shape definitions are implemented in `schematic.js`; there is no JSON shape-definition layer.

Signal-path drawings require the transmitter and receiver to be passed explicitly because the nPort's RF construction metadata does not know which downstream receiver was created. MOD and DEMOD connectors represent functional signal flow; they are not nPort S-parameter ports. The RF circuit between them retains its usual component metadata and numeric behavior.

The main internal functions in `schematic.js` divide the work as follows:

| Internal function or group | Job |
| --- | --- |
| `buildSchematicModel()` | Selects a cascade or nodal model from `circuit._schematic`. |
| `requestedShape()`, `shapePath()` | Read and validate the requested shape hint or node-bounded shape sections. |
| `isSeriesPath()`, `isSeriesShape()`, `isLadderShape()`, `buildSeriesLadderModel()` | Match series and ladder sections against the actual nodal connections, then build their layout model. |
| `branchlineArm()`, `branchlineShortest()`, `branchlineBinding()` | Trace two-port arms and bind a rectangular one- or multi-cell branchline from its junctions and external ports. |
| `branchlinePositions()`, `branchlineJunctionPlacement()`, `branchlinePartPlacement()`, `buildBranchlineModel()` | Place the bound branchline cells, orient each symbol from its connected ports, and build the drawing graph. |
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

## The underlying theory of schematic.js

This section explains the algorithmic ideas visible in the implementation. `schematic.js` combines circuit-graph analysis with rule-based layout and collision checks; it does not use one universal schematic-layout algorithm.

An RF circuit has **components, ports, and electrical nodes**. A supported constructor supplies a component with ordered ports and attaches a `_schematic` record naming its drawing symbol and relevant values. A node number in `nodal()` identifies one electrical connection shared by every listed port with that number. This is a connectivity statement, not a coordinate. Several ports can share one node even if their symbols are drawn far apart.

The renderer keeps two models separate:

- **Topology** records which component ports share each node or which cascaded ports connect. For nodal circuits, a node can join more than two ports. For cascades, the binary construction tree records how intermediate nPorts were assembled.
- **Drawing graph** assigns coordinates, rotations, wires, labels, node circles, and a `viewBox` to a selected visual layout of that topology. Different drawings can represent the same topology.

`nPort.cas()` records `{kind: 'cascade', left, right}` using the two operands' metadata. `nP.cascade()` builds through `cas()` and preserves the tree. `nP.nodal()` records its component entries as `{part, nodes}` and stores the external node order. This metadata travels with the returned nPort; the renderer does not infer a circuit from its numeric S matrix. Reusing one component object in separate connections creates separate placements with the same part metadata.

For a nodal network, `topology.loopAnalysis` describes cycles in the actual connections. The detector treats each component row and each electrical node as a vertex, with one edge for every numbered component port; external ports do not add edges. It builds a spanning forest and reports each `closingEdges` entry that connects vertices already joined. `cycles` lists the tree path plus that closing edge for each independent cycle. An edge is `{component, port, node}`: `component` is the one-based position of the component row in `nodal()`, and `port` is the component's one-based port number. `hasLoops` is true when any closing edge exists. The renderer uses this analysis to select a closed-loop or parallel-branch layout when the connections fit those general arrangements.

### Cascade flattening and series placement

`flattenCascade()` recursively walks the binary cascade construction tree in left-to-right order, producing the two-port series chain. A completed two-port nodal network is kept as one `nodal` block. With `view: 'blocks'`, `repeatedCascades()` counts cascade objects by identity and `blockViewTree()` replaces repeated subtrees with block symbols at their occurrences. If no repeated subtree exists, nested cascade operands directly below the root are still shown as blocks; leaf components remain individual symbols.

`placeComponents()` places the chain greedily along its current direction, normally left to right. It rotates each symbol by 90-degree steps so its entry port faces the direction of travel. It tries successive gaps on the 20-unit grid and takes the first placement whose body bounds clear earlier bodies and wires, and whose connecting segment does not run through an earlier body. This is a local placement rule, not a global search for the best arrangement.

### Discrete annotation placement

In layouts that use the annotation search, component labels, external-port labels, and node-number circles receive candidate positions at increasing distances from the related symbol or node. Candidate order and cost prefer the side that suits the symbol's aspect ratio, then favor smaller offsets and distances. `annotationOptions()` removes collisions and retains up to 32 low-cost options. `chooseAnnotations()` expands partial assignments, rejects overlaps, and keeps the 96 lowest-cost states at each step. This is beam search for discrete annotation placement, closely related to point-feature label placement in cartography. Some simpler layouts assign label positions directly instead.

### Nodal layout strategy

An explicit `options.shapes` request is checked first. The supported requests are `series`, `ladder`, `branchline`, and a node-bounded series section followed by a ladder section. Each request validates that the actual connections fit; a mismatch throws an error rather than silently selecting another shape.

Without a shape request, the renderer tries layouts by topology:

1. For loop-free two-port networks, `buildFlowNodalModel()` searches from external port 1 to port 2 with DFS, traversing each symbol's permitted through-port pair. It places this path horizontally and can hang simple terminating shunt chains downward. This is the familiar ladder-like drawing rule; the explicit `ladder` request additionally checks that the connections satisfy the ladder definition.
2. `buildTreeNodalModel()` handles other connected, loop-free tree structures whose shared nodes each join at most two component terminals. It finds a deepest source-rooted spine, places it horizontally, then attaches child components perpendicular to their parent's actual port. Wires use L-shaped routes.
3. For loops, the order is `buildParallelNodalModel()` for parallel two-port branches between two external nodes, `buildJunctionPathsNodalModel()` for two multiport junctions joined by three or more one-component paths, then `buildSingleLoopNodalModel()` for a supported single closed loop.
4. An explicitly requested `branchline` uses `buildBranchlineModel()`. Its matcher traces chains of two-port parts between flow-enabled three-port junctions, then uses BFS to find the upper and lower rails and checks the connecting rungs. It lays out the matched cells on a rectangular grid; an arm may contain multiple two-port parts.
5. If none of the automatic layouts fit, `buildGraphNodalModel()` provides a general node-routing fallback. In this automatic sequence, a builder that cannot represent its case returns `null` so the next eligible builder can try. A forced shape instead reports a mismatch. The general fallback can still fail if its connections cannot be routed.

### Graph algorithms and routing

- **Union-find and fundamental cycles:** `nodalLoopAnalysis()` represents component rows and electrical nodes as graph vertices and each component port as an edge. A disjoint-set structure with path compression builds a spanning forest. An edge whose endpoints already belong to the same set is a closing edge; `treeEdgePath()` finds the tree path between its endpoints, and adding the closing edge gives a fundamental cycle. This is the standard spanning-tree/fundamental-cycle approach used in circuit graph analysis. It is related to cycle-basis methods, but the code should not be described as Paton's specific algorithm.
- **Breadth-first search:** `branchlineShortest()` uses BFS to find shortest paths through the branchline junction graph. `graphLevels()` uses BFS depth in the component adjacency graph to assign layers in the general fallback. This is a simple layered layout, not a full Sugiyama implementation with crossing minimization.
- **Lee-style maze routing:** `graphRoute()` searches the 20-unit coordinate grid with BFS, rejecting points inside component bounds or on blocked terminals. It reconstructs a shortest route; ordering neighbors by distance to the destination only prefers among equal-length routes. Collinear points are removed afterward.
- **L-shaped routing:** the tree and hand-structured loop/parallel layouts use `routeBetween()` to join terminals with one orthogonal bend when a straight segment is not available. They do not use the grid maze router.

These names describe algorithm families observable in the current code. They do not identify specific publications as sources consulted during implementation.

### Symbol geometry, crossings, and output

`schematicSymbols.js` supplies generated SVG geometry, port coordinates, body bounds, lead segments, and optional flow metadata. Its canonical drawing source is [`schematics/symbols/`](../schematics/symbols/), with runtime placement details in [`runtime-symbol-layout.json`](../schematics/runtime-symbol-layout.json). `nodalBlockSymbol.js` uses the same symbol data to generate a rectangular block with the requested number and arrangement of ports; it is not the source of the individual component artwork. The runtime renderer imports these helpers directly and does not use ELK.

`rotateVector()` transforms port offsets in 90-degree steps. `nodalPlacement()` applies those rotations and the optional Y mirror to each canonical port coordinate, so electrical port numbering remains attached to its symbol terminal. Layouts use the shared 20-unit grid, and the general wire router explicitly advances on that grid. However, placement transforms do not snap every resulting coordinate independently; branchline arm placement divides a span among the arm components, so some combinations of arm lengths can yield off-grid coordinates.

`wireCrossings()` detects strict intersections between horizontal and vertical segments belonging to different nodes. `renderNodalSvg()` masks each crossing with a small white rectangle, then draws a straight horizontal segment over it. The crossover is therefore shown as a gap with a continuous straight line, not a hop arc.

`renderSchematicSvg()` builds SVG markup as a string and uses `escapeXml()` for displayed text. `schematicSvg()`, `schematicGraph()`, and `schematicTopology()` return the SVG markup, layout graph, and connection data without mounting the drawing; these are source-module exports. The public `schematic()` function mounts the SVG and toolbar, and returns `{svg, graph, topology}`. PNG copy serializes the mounted SVG, draws it through an image and canvas, creates a PNG `Blob`, and passes it to the Clipboard API. A `ResizeObserver` updates a fitted drawing when its viewport changes. Component values in labels are formatted with `toPrecision()`; that formatting does not change the nPort values.

When a completed `nodal()` nPort is connected as one part of a larger nodal circuit, it appears as a `nodal` block. The canonical SVG is the two-port reference. `nodalBlockSymbol()` generates the same rectangular form for other port counts, with 20-unit leads and stable port numbering; its geometry can put individual ports on any of the four sides. The current automatic layout starts with port 1 on the left and the remaining ports on the right, then may rotate or reflect the whole block. The nested circuit's full `_schematic` connection record remains available. A top-level nodal circuit still expands to its component drawing.

For a nodal network, the renderer first analyzes the connections for cycles. Parallel two-port components between the same external nodes are placed in rows between shared left and right junction wires. Two multiport junctions joined by several one-component paths use stacked lanes. When one cycle uses every component, the renderer places component centers around an ellipse. It tests both traversal directions and scores quarter-turn rotations (and mirrors for multiport symbols) by how well their ports face neighboring components and outward external ports. These rules use connection structure rather than constructor names or a named circuit pattern. Other cyclic networks use the general node-routing fallback.

For networks without loops, the renderer searches for a two-port path from external port 1 to external port 2. If that path has simple shunt branches, it places the main path horizontally and the branches vertically, following the actual port-to-node assignments. The RC low-pass circuit uses this layout: resistor and tee on the main path, capacitor and short on the shunt. For other tree-shaped multiport circuits, it derives component links from shared nodes, finds the deepest path from the first external port, and places that path horizontally. Other components attach as branches at their actual numbered ports. External wires leave each symbol in the outward direction of its terminal, keeping adjacent ports separate. Node dots are placed on routed wire segments; labels and node numbers are placed with collision checks. The VNA circuits and the three-port tee divider use this general tree layout. When a network does not fit these layouts, the fallback places components in graph-distance layers and routes each electrical node directly among its terminals. The fallback router uses the 20-unit grid and avoids symbol bodies and other terminals. Crossings between different nodes are marked with a white patch and a straight horizontal line, not a hop arc.

## Boundaries and checks

`nP.schematic()` requires drawing metadata and a symbol bundled in `schematicSymbols.js`. Its signal-path form currently accepts a two-port RF component or cascade between a transmitter and an optional receiver. Other signal-flow blocks such as `FFT()` are canonical SVGs but do not yet have runtime layout support. The authoring composer handles broader signal-flow diagrams separately using named signal connections rather than RF node numbers.

The [network-only development harness](../dev/schematic.html) draws 29 direct and stress circuits through the public API. Its `dev/schematicStressCases.js` cases include loops and other nodal arrangements that exercise the general node router.

Useful checks are `npm run symbols:gallery`, `npm run symbols:bundle`, `npm run symbols:check`, `npm run schematics:build`, and `npm run schematics:check`. `npm run build` is needed after changing runtime symbol data or `schematic.js`; it regenerates the symbol module and must be followed by copying the browser bundle to `docs/public/nP.js` for the REPL. Visual inspection remains necessary for spacing, labels, and clarity even when structural checks pass.

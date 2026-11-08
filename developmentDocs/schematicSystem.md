<!-- Modified: 2026-11-07 -->
# Schematic system

This note explains how an nP network becomes a recognizable RF schematic. It starts with two series resistors, follows their data through the one reusable interpreter (ORI), and then explains the board language and graph algorithms behind the drawing.

## Overview: drawing two series resistors

This example shows the main runtime workflow: create an RF network with `nodal()`, then call `nP.schematic()` to draw it. The `series` shape option guides the layout. The example sets a frequency for the RF calculation; the schematic itself uses connection metadata and symbol geometry rather than the numerical S-parameters.

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


### Drawing failures and downstream JavaScript

The browser-facing `nP.schematic()` catches drawing failures, logs the original error to the console, and displays a message in the requested output area. It then returns normally, so the engineer's following `lineTable()`, `lineChart()` or other JavaScript statements can execute without a caller-side `try/catch`.

A successful return contains `{svg, graph, topology, error: null}`. On failure, it contains `{svg: null, graph: null, topology: null, error}`. The message is inserted as text. If the requested mount is missing or its selector is invalid, the message falls back to the document body when available. Errors in lower-level source-module helpers such as `schematicGraph()` still throw; the browser API provides the display-and-continue boundary.

### Layout and render

**Layout** turns the electrical connections into a drawing model. For this example, `interpretSchematicBoard()` reads the `series` board definition and chooses each resistor's position and orientation and the wires between numbered ports. `buildInterpretedBoardModel()` adds node numbers and component labels to the resulting layout. The resulting `graph` describes those placements and connections; `topology` gives a separate view of the electrical connectivity.

**Render** turns that drawing model into SVG. `renderNodalSvg()` reads the graph and the canonical resistor artwork and draws the symbols, wires, dots, and text. `schematic()` mounts the SVG in the requested location and adds a toolbar above it. The toolbar contains <button type="button" disabled>Copy as png</button> and <button type="button" disabled>Fit drawing</button>; after fitting, the second button becomes <button type="button" disabled>Actual size</button>.

On success, the return value separates the visible picture from the data behind it. `drawing.svg` is the mounted SVG element. `drawing.graph` describes the layout, including symbol placements, wires, labels, and coordinates. `drawing.topology` describes the circuit connections between component ports and electrical nodes. Code can inspect all three without reading the rendered SVG markup.

#### How the data objects fit together

These are the data structures in order, from electrical input to visible SVG:

1. **Circuit metadata.** `circuit._schematic` records each component and the node connected to each numbered port. This is the electrical connection source.
2. **Temporary layout data.** Layout code creates component placements, transformed port coordinates, wire paths, and label positions. Algorithms also build temporary adjacency structures to trace paths and detect loops.
3. **Builder result.** A wrapper object holds the drawing graph and electrical topology as sibling outputs:

   ```js
   model = {
     graph: drawingGraph,
     topology: electricalTopology
   };
   ```

4. **Drawing graph.** This is the render-ready layout data: placed components, nodes, wires, labels, external ports, and `viewBox`. It is `model.graph` inside the builder result and becomes `drawing.graph` in the public return value.
5. **Electrical topology.** This is a connection summary: which component ports share each node, plus loop analysis. It is returned for inspection; the SVG renderer does not use it.
6. **SVG.** `renderNodalSvg(model)` reads `model.graph` and produces the picture.

There is one drawing graph, not a separate “model graph” and “drawing graph.” The word *model* refers to the wrapper returned by a layout builder. `model.graph` and the public `drawing.graph` refer to the same drawing-graph data; temporary placement, adjacency, and search structures are not additional returned graphs.

For guided nodal drawings, the implemented data flow is:

```text
circuit._schematic + shape definition
                 ↓
        match and layout
                 ↓
      model.graph + topology
                 ↓
          SVG renderer
                 ↓
                SVG
```

`nodal()` supplies the electrical connections. ORI applies the selected board definition to those connections, and the SVG renderer draws the resulting graph. Symbol artwork and numbered port coordinates come from the generated `schematicSymbols.js`. The shape definition guides layout; it does not change the network.

### Returned `graph` and `topology`

For the example above, `nP.schematic()` returns an object containing `svg`, `graph`, and `topology`. The `svg` is the mounted SVG element. The other two values are plain JavaScript data objects. Here are selected fields from the current resulting graph (coordinates are schematic units). Per-component and per-wire `boardTile` records and the `board` inspection data are omitted from this listing for readability:

```js
graph = {
  kind: 'rf-nodal',
  layout: 'series',
  shape: 'series',
  cells: 2,
  viewBox: [-60, -90, 640, 350],
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

`drawing.graph.board` also contains `grid: 10`, `interpreter: 'ORI'`, `version: 1`, and a `boxes` array. For these two resistors, that array contains two component boxes and three wire boxes. Each component or wire's `boardTile` identifies its expanded board instruction. These records make the board interpretation inspectable alongside the visible drawing.

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

### Following the two resistors through ORI

The significant calls for this example occur in this order:

```text
schematic()
  → mountSchematic()
  → buildSchematicModel()
    → buildNodalModel()
      → schematicShapeBoards.series
      → buildInterpretedBoardModel()
        → interpretSchematicBoard()
          → bindBoardPaths() → traceBoardPath()
          → placeBoardPaths() → placeBoundBoardPaths() → placeBoardTiles()
        → annotations + boardBoxes() + flowTopology()
  → renderSchematicSvg() → renderNodalSvg()
  → mount SVG + toolbar
```

`interpretSchematicBoard()` builds a map from each electrical node to its attached numbered terminals. `traceBoardPath()` starts at external node 1, finds R1's port 1, crosses R1 to node 2, then crosses R2 to node 3. The binding contains the two component-row indices and their entry and exit port numbers. It is independent of the order in which those rows were written.

`expandBoardTiles()` turns the repeated component instruction into five boxes: input wire, R1, middle wire, R2, output wire. `placeBoardTiles()` walks those boxes, starting at `[40, 100]`. With 80-unit wires and 100-unit resistor spans, R1 starts at `[120, 100]` and R2 at `[300, 100]`. Node 2 remains the electrical connection between R1 port 2 and R2 port 1. The common finalizer chooses labels and node-number positions and records the drawing graph. `flowTopology()` then computes the connection summary and loop analysis. For this guided series example, union-find is used for the returned topology after placement, rather than to select a drawing style before placement.

The table lists selected functions used by this example, followed by the toolbar actions. It is not a complete inventory of either source module. A function marked **(Outside schematic.js)** is identified with its defining module in the explanation.

<table>
  <thead>
    <tr><th>Job</th><th>Functions</th><th>What they do and why it helps</th></tr>
  </thead>
  <tbody>
    <tr><td rowspan="5">Choose the drawing path</td><td><code>schematic()</code></td><td>Public entry point. Mounts the SVG and toolbar and returns the drawing graph and topology.</td></tr>
    <tr><td><code>schematicSignificantDigits()</code></td><td>Checks label precision so displayed values follow a consistent format.</td></tr>
    <tr><td><code>buildSchematicModel()</code></td><td>Reads the construction record and dispatches a nodal network without calculating its S-parameters again.</td></tr>
    <tr><td><code>buildNodalModel()</code></td><td>Resolves the requested board and calls the shared finalizer. The opening example uses ORI because it requests the series shape.</td></tr>
    <tr><td><code>requestedShape()</code></td><td>Validates the shape option so the requested engineering layout intent is explicit.</td></tr>
    <tr><td rowspan="6">Confirm the circuit fits</td><td><code>interpretSchematicBoard()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Checks the language version, external nodes and terminal incidence, then interprets the definition using shared operations.</td></tr>
    <tr><td><code>bindBoardPaths()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Binds the definition&#x27;s path to actual component occurrences and requires complete coverage when requested.</td></tr>
    <tr><td><code>traceBoardPath()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Uses an iterative depth-first search to trace actual node connections from input to output. Node numbers determine connectivity, not coordinates or row order.</td></tr>
    <tr><td><code>acceptsEntry()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Checks the data predicate, such as two ports, without a JavaScript test for a particular RF circuit.</td></tr>
    <tr><td><code>boardPortPairs()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Supplies both directions through a two-port or reads a junction&#x27;s permitted through ports from symbol metadata.</td></tr>
    <tr><td><code>symbolForSchematicEntry()</code><br>(Outside schematic.js)</td><td>In nodalBlockSymbol.js. Resolves canonical runtime geometry, including a generated nodal block when an upstream network is used as a part.</td></tr>
    <tr><td rowspan="12">Place parts and wires</td><td><code>buildInterpretedBoardModel()</code></td><td>Calls ORI with shared symbol and placement helpers, then finishes the graph with annotations, bounds, board boxes and topology.</td></tr>
    <tr><td><code>placeBoardPaths()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Starts the main board at its input port and reuses tile placement for any declared attachments.</td></tr>
    <tr><td><code>expandBoardTiles()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Expands the repeated component instruction into R1 and R2 with a wire between them.</td></tr>
    <tr><td><code>placeBoardTiles()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Walks the expanded boxes and advances through actual transformed terminals; it does not invent electrical nodes.</td></tr>
    <tr><td><code>orientBoardPart()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Chooses quarter-turn rotations and reflections that meet the path direction and any attached-port directions.</td></tr>
    <tr><td><code>rotateBoardVector()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Transforms direction vectors consistently for those orientation decisions.</td></tr>
    <tr><td><code>flowPartId()</code></td><td>Assigns occurrence IDs such as R1 and R2, including when a component object is reused.</td></tr>
    <tr><td><code>nodalPlacement()</code></td><td>Creates a component placement with each public port still attached to its original node.</td></tr>
    <tr><td><code>transformedPoint()</code></td><td>Transforms canonical coordinates as one symbol, preserving its proportions and numbered terminals.</td></tr>
    <tr><td><code>rotateVector()</code></td><td>Applies quarter-turn coordinate rotations used by the placement transform.</td></tr>
    <tr><td><code>appendBoardWire()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Joins points only when they share the electrical node and form a nonzero horizontal or vertical wire.</td></tr>
    <tr><td><code>boardWireDot()</code><br>(Outside schematic.js)</td><td>In schematicBoardInterpreter.js. Chooses an on-grid node-dot position along the wire.</td></tr>
    <tr><td rowspan="7">Return useful circuit information</td><td><code>componentLabel()</code></td><td>Creates the designator and value text from component metadata.</td></tr>
    <tr><td><code>labelCandidates()</code></td><td>Proposes positions for component and external-port text around the placed geometry.</td></tr>
    <tr><td><code>treeNodeCandidates()</code></td><td>Proposes nearby positions for the circled node numbers, keeping them distinct from electrical dots.</td></tr>
    <tr><td><code>chooseAnnotations()</code></td><td>Uses collision checks and beam search to choose readable positions for the labels and node numbers together.</td></tr>
    <tr><td><code>boardBoxes()</code></td><td>Records the component and wire boxes so the interpreted board can be inspected in drawing.graph.board.</td></tr>
    <tr><td><code>flowTopology()</code></td><td>Groups actual numbered component ports and external ports by node, giving code an electrical summary apart from coordinates.</td></tr>
    <tr><td><code>nodalLoopAnalysis()</code></td><td>Uses union-find and a spanning forest to report loops in that summary. The two-resistor network has no closing edges.</td></tr>
    <tr><td rowspan="5">Render and mount</td><td><code>renderSchematicSvg()</code></td><td>Selects the SVG renderer for the completed model type.</td></tr>
    <tr><td><code>renderNodalSvg()</code></td><td>Draws canonical symbols, wires, dots, node numbers and labels from model.graph; it does not interpret shape definitions.</td></tr>
    <tr><td><code>escapeXml()</code></td><td>Escapes displayed text so labels produce valid SVG markup.</td></tr>
    <tr><td><code>sizeSchematicSvg()</code></td><td>Sets SVG display dimensions for actual-size and fitted views.</td></tr>
    <tr><td><code>styleSchematicButton()</code></td><td>Styles the fit and copy controls consistently.</td></tr>
    <tr><td rowspan="4">Respond to toolbar actions</td><td><code>toggleSchematicFit()</code></td><td>Switches between Fit drawing and Actual size when the button is clicked.</td></tr>
    <tr><td><code>updateFittedSchematic()</code></td><td>Updates the fitted scale when the available width changes.</td></tr>
    <tr><td><code>copySchematicPng()</code></td><td>Copies the visible schematic as a PNG when requested.</td></tr>
    <tr><td><code>schematicPngBlob()</code></td><td>Rasterizes the SVG to a PNG blob for clipboard export.</td></tr>
  </tbody>
</table>

## One reusable interpreter (ORI)

**One interpreter, many shapes, no JavaScript layout helper for an individual shape.** ORI is the shared interpreter in [`schematicBoardInterpreter.js`](../src/np-chart/src/schematicBoardInterpreter.js). The seven named shapes in [`schematicShapeBoards.js`](../src/np-chart/src/schematicShapeBoards.js), their variants, and the generic board are data objects. They contain no layout callbacks. JavaScript's module syntax exports the data so Rollup can bundle it; the shape language is the fields and operations inside those objects.

### Truth and engineering layout intent

The network is the electrical truth: its component occurrences, public numbered ports and node connections must survive drawing. The canonical symbols are the drawing truth: their geometry, pin lengths and port coordinates define each component's appearance. A shape is **truthy** in the sense used here: it expresses the engineer's intended arrangement, such as a series path, a ladder or a rectangular branchline. That intent guides a drawing of the existing network. It cannot change an electrical connection to make a picture fit.

The engineer supplies a network and a shape name:

```js
var drawing = nP.schematic(seriesCircuit, {
    shapes: ['series']
});
```

When developing another shape, its intended board can first be drawn on paper, described in English, or listed like positions and moves in a board game. A developer translates that description into the shared board language. The runtime reads the resulting data objects; it does not interpret sketches, English or source-code comments. The engineer using a completed shape does not supply a separate layout program or edit the rendered schematic.

### The board language

The board is a layout template. Components occupy boxes; horizontal and vertical wires occupy boxes; a corner wire has its own box. A repeated instruction can stand for one, two or thirteen actual components. The connections still come from the network. The description tells ORI the arrangement in which to fit them.

A definition contains two pieces of data. `match` describes which connections fill the board: here, trace between external ports 1 and 2 through two-port components, consuming every component. `board` describes the boxes: an input wire, one or more component boxes separated by wires, and an output wire. The count and component types come from the network. The definition specifies the initial direction, grid and wire length. Symbol geometry supplies terminal positions and any change of direction at a bend.

```js
// Abbreviated from the series definition; this is data, with no callback functions.
{
    name: 'series',
    version: 1,
    match: {
        externalPortCount: 2,
        paths: [{bind: 'parts', from: {externalPort: 1}, to: {externalPort: 2},
            through: {portCount: 2}, minimum: 1, coverAllComponents: true}]
    },
    board: {
        grid: 10,
        from: {externalPort: 1},
        to: {externalPort: 2},
        origin: [40, 100],
        direction: 'right',
        wireBoxLength: 80,
        tiles: [
            {kind: 'wire'},
            {kind: 'component', source: 'parts', repeat: 'oneOrMore',
                between: {kind: 'wire'}},
            {kind: 'wire'}
        ]
    }
}
```

The current vocabulary includes the following data fields:

| Board concept | Data representation | What the engineer sees |
| --- | --- | --- |
| Repeated path | `match.paths`, component predicates and `repeat: 'oneOrMore'` | A variable number of connected parts following the same visual path |
| Attached path | `match.attachments` and `board.attachments` | A shunt starts at the actual unused junction port and follows the stated direction |
| Rejoining path | `match.connections` and `board.connections` | A bridge leaves one main-path junction and rejoins another, with repeated component/wire boxes on a separate track |
| Rectangular arrangement | `rows`, `lanes`, column repetition and external-port cells | Connected lanes occupy familiar rectangular cells |
| Named junction arrangement | `anchors`, junction `cell` pairs, `lanes` and external-port slots | Junctions occupy a declared pattern while connecting paths accept variable component counts |
| Shape-family alternatives | `alternatives` containing further board descriptions | One requested shape name supports more than one connected arrangement |
| Board reuse and reflection | `use` names another board; `transform` supplies boolean `mirrorX` and/or `mirrorY` | A divider can face the other way as a combiner while preserving numbered electrical terminals |
| Section interface | `interface: {from: [...], to: [...]}` maps each side to numbered board ports | Several guided regions join at existing nodal nodes without introducing network blocks |
| Named role | `match.slots` and candidate numbered-port roles | The input part, upper/lower junctions and bridge occupy their intended positions |
| Relative position | `from`, `anchor`, `offset`, `at` | A component is placed relative to another named terminal or the board origin |
| Terminal direction | `directions` or path/lane `direction` | Pins face the right neighbors after quarter-turn rotation or reflection |
| Numbered multiport path | Through predicate `portPairs`, tile `orientation.terminals: 'leads'` and `orientation.advance` | A repeated multiport section follows its actual terminal leads and advances to the next staircase level |
| Outward termination | Attachment `direction: 'terminal'` | The termination follows the transformed canonical lead at its own numbered port |
| Attachment clearance | `spacing: 'attachments'` and `clearance` | Main-path wire boxes grow from measured body bounds when outward terminations need room |
| Corner route | A wire's `route: 'verticalFirst'` or `'horizontalFirst'` | An orthogonal turn with a corner box between straight wire boxes |
| Centerline | `centerlines`, `axis`, `reference`, `between`, `align` | Terminal axes and component midpoints share the intended line |

Units are explicit: `grid` is the placement step in SVG units; named-slot `at`/`offset` pairs and external-port `cells` are counts of that step. Board `origin`, path `wireBoxLength`, and connected-board lead `length` are SVG units. For example, an offset of `[4, 0]` on the 10-unit grid is 40 SVG units. The description is independent of circuit node-number values; node 10 does not mean coordinate 10.

The interpreter binds by electrical connections, so rearranging the `nodal()` rows or reversing a resistor's numbered ports does not change the path. It creates new placement and wire records without changing the network. `buildInterpretedBoardModel()` uses the shared symbol geometry and annotation functions to turn those records into the existing drawing graph. The SVG renderer is unchanged. `drawing.graph.board.interpreter` identifies this route as `ORI`.

**Current scope:** the interpreter supports repeated paths, attached paths, rejoining paths between existing anchors, connected lanes, named component slots, references with axis reflections, and composition of node-bounded sections with compatible interfaces. The seven named single-shape requests use ORI; `powerDivider` has transformer and Wilkinson alternatives, and `powerCombiner` reuses both. All nodal drawings and node-bounded board compositions use ORI. Cascade and signal-path drawings retain their separate series-layout route. ORI handles the connections described by those boards; arbitrary guided loop arrangements and broader symmetry rules remain future work. A new shape expressible with the current operations can be supplied as another description without changing ORI. A genuinely new language operation requires an extension to the shared interpreter, rather than a callback dedicated to that shape.

For a ladder, `match.paths` binds the main path using each junction symbol's through ports. `match.attachments` traces every unused port on that path through two-port components to a one-port termination. `coverAllComponents` requires the definition to account for the complete network. The board's `attachments` describes repeating branch boxes and sets their direction to `down`. Changing this direction to `up` works through the same operations; it also rotates the junctions and terminations accordingly. Symbol geometry and the original numbered electrical ports remain authoritative.

The interpreter binds all paths before placing them. It first places the main boxes, orienting junction ports toward their attached paths. It then starts each branch at its actual transformed junction terminal, reusing the same tile-placement operation. The shared drawing-model finalizer adds node dots, numbers and labels. There is no separate JavaScript ladder board builder.

For `bridgedT`, the data adds rejoining paths to that arrangement. `bindBoardLinks()` starts at unused main-path ports and uses `traceBoardLink()` to follow two-port objects until reaching another unused port farther along the main path. It reserves both endpoints and all intervening components before ordinary attachment matching traces the remaining ports to one-port terminations. The definition requires at least one bridge, at least one shunt, and complete coverage. It permits multiple main, bridge and shunt components and repeated or nested bridge intervals.

`boardPathSpacing()` measures bridge symbol spans plus wire boxes and grows the main path's flexible wire boxes when necessary. It requires straight canonical terminal pairs along these paths. `placeBoardLinks()` uses actual placed bounds and the declared clearance to reserve perpendicular tracks. Disjoint intervals share a track; shorter intervals are assigned inner tracks before enclosing intervals. Bridge placement reuses `placeBoardTiles()` and replaces the first/last straight leads with `appendCornerBoardWire()` routes to the real junction terminals. The bridge has no invented components or electrical nodes. A test changes the board data to put rejoining paths below and terminated attachments above, using the same operations under another name.

Three-port junctions retain their declared through-port pair. A junction without that declaration can offer straight opposite pairs derived from its canonical port coordinates around its body center. This permits a four-port junction to carry a bridge above and a shunt below the same main-path position. In the `Tee4()` examples the main path uses ports 2 and 4, the bridge port is 3, and the shunt port is 1. Rotations preserve those numbered electrical connections. This geometry rule does not test a constructor name.

For `edgeCoupledFilter`, the data declares a repeated four-port path through terminal pairs 1/3 or 3/1. The other two ports of each section must connect directly to one-port terminations supplied in the network. The tile's `orientation: {terminals: 'leads', advance: 'down'}` tells the shared orientation operation to align the incoming/outgoing lead directions and require a downward displacement between the selected terminals. The next straight wire begins at that displaced output terminal, so successive horizontal coupled symbols form a staircase. The dimensions and vertical step come from canonical symbol geometry; the physical line length still belongs to RF analysis.

Attachments with `direction: 'terminal'` follow their actual transformed lead direction. Unused ports therefore receive outward-facing left and right terminations. `spacing: 'attachments'` first previews component and termination body bounds without consuming reference designators. Each main-path component has a progress rank given by the number of flexible wires before it; its attachments inherit that rank. For bodies whose perpendicular extents overlap, the spacing calculation derives the additional wire length needed to separate successive ranks by the declared clearance, rounds up to the placement grid, then places the actual components once. This is a shared geometry constraint, not a table of coupled-filter stage positions. It allows larger short/load symbols as well as the usual opens.

`nP.schematic(network, {shapes: ['edgeCoupledFilter'], flipVertical: true})` reflects the whole ORI layout about y = 0 before annotations, producing the upward staircase. This boolean option uses the shared reflection operation for inline definitions, referenced boards and complete ORI compositions. Canonical transforms, numbered terminals, wires and node dots reflect together; labels are laid out afterward as ordinary text. Cascade and signal-path drawings do not support this option; series/ladder board compositions do. The same orientation operation can also interpret `advance: 'up'` in a data-only board under another name.

For a branchline, the description names rows and lanes rather than particular RF parts. `match.anchors` identifies allowed junction symbols; `match.through` describes the components allowed between them. `board.rows` supplies the rows, and `board.lanes` supplies repeated connections between adjacent columns or between rows at each column. External-port descriptions fix the corner assignment and the direction of each port lead. ORI contracts each intervening component chain into a connection, then matches that connection graph to the expanded board slots. Matching checks the full network, including the numbered terminal at each end of every lane.

The shared connected-board operation measures the real symbol terminal spans plus the required wire boxes. `spacing: 'largestArm'` makes the board pitch large enough for the longest lane, keeping cells square. Shorter lanes retain their symbols at their canonical size; their remaining space is divided between their first and last real wire boxes. There are no placeholder components or invented nodes. Each lane then uses the same `placeBoardTiles()` operation as series and ladder, with fixed terminals at both ends. Grid position, orientation, label placement and SVG rendering remain shared operations.

This operation is not limited to two named rows. A check uses the same two-cell electrical network with a three-row description and ports facing up and down. That arrangement is supplied entirely by data. That check exercises the same operations without a branchline-specific matcher or drawing builder.

For the transformer power divider, `match.slots` gives component predicates and possible numbered ports for each role. For example, either transformer port can be the input; either through port of a tee can face its output receiver. `board.wires` specifies the slot-to-slot and external-port connections. The same generic matcher assigns actual components and port numbers to these slots by comparing electrical nodes. It requires every component and terminal to be accounted for.

`board.components` positions a component relative to a named terminal of an already placed slot. Offsets are whole board cells, and `directions` specifies which way each terminal faces. The interpreter reads the canonical lead geometry to choose a 90-degree rotation and reflection. The resistor is placed one wire box below the upper tee's common pin. The lower tee is positioned from the resistor's other end, so both ends have a real wire rather than coincident symbol terminals. These rules are data in the shape description; there are no transformer or tee names in the interpreter's layout operations.

The corner-wire operation splits a right-angle connection into a straight wire box, a corner box, and another straight wire box. Each straight box has a real electrical node; the corner box carries no node dot, touches only wire boxes and stays clear of symbol terminals. ORI records the corner in the board inspection data and emits its two line segments to the existing SVG renderer. The same slot and routing operations interpret this arrangement without a transformer-divider-specific JavaScript builder.

The `powerDivider` description also contains a Wilkinson alternative. It declares three named junction `anchors` at board cells `[0, 1]`, `[1, 0]` and `[1, 2]`. The two arm lanes turn from the input junction upward/downward and then right; a third lane connects the output junctions downward through the isolation resistor. External-port declarations fix port 1 on the left and ports 2 and 3 on the upper and lower right. Matching uses the same contracted path graph and slot assignment as branchline, with both ideal and microstrip tee symbols allowed. The output tees' common ports face the resistor; their through ports connect the arms to the external outputs.

`spacing: 'byAxis'` measures lanes independently along each axis. The longest arm controls horizontal pitch; the vertical isolation lane controls output separation. Named cell positions keep the input halfway between the outputs. Each arm can contain one or more two-port components, while the isolation lane accepts resistors. A turning lane uses `placeBoardTiles()` for the components on its final straight segment and `appendCornerBoardWire()` for its entry. No named RF constructor, circuit variable, or example coordinate appears in these shared operations.

ORI reads `alternatives` only after the caller requests the containing shape. It tries the primary board and then its alternatives, retaining the matching definition for annotations and graph metadata. A transformer drawing reports `pattern: 'transformer'`; a Wilkinson drawing reports `pattern: 'wilkinson'`. This is selection within an explicitly requested family, not automatic shape selection for `nP.schematic(network)`. Resistive and multistage power dividers remain future descriptions. The current data definitions contain no JavaScript layout callbacks; they do not establish a universal shape language.

The `powerCombiner` definition reuses that family rather than copying either layout:

```js
powerCombiner: {
    name: 'powerCombiner',
    version: 1,
    use: 'powerDivider',
    transform: {mirrorX: true}
}
```

`interpretSchematicBoard()` resolves the reference through the registry supplied by the common adapter. Once the referenced board has bound and placed all components, `reflectBoardResult()` reflects the complete geometry about the vertical axis through x = 0. Component anchors, rotations and local reflections, numbered terminal positions, wire paths, node dots and external ports change together. The original port identities do not change: port 1 becomes the common output on the right; ports 2 and 3 face left. Shared annotation placement runs afterward, so labels remain readable. The final viewBox includes negative coordinates. The same operation supports `mirrorY`, references to other boards, and chained references; unknown references and cycles report errors. A reflection is layout reuse, not composition of several board regions in one network.

For a divider followed by a combiner in one nodal network, the engineer can name both sections:

```js
nP.schematic(network, {
    shapes: [
        {name: 'powerDivider', from: 1, to: [40, 41]},
        {name: 'powerCombiner', from: [40, 41], to: 2}
    ]
});
```

ORI delegates a section list to the shared `composeSchematicBoards()` operation in `schematicBoardComposition.js`. Each board declares its interface as data: the divider maps `from` to numbered port 1 and `to` to ports 2/3; the combiner maps `from` to ports 2/3 and `to` to port 1. The composer builds electrical adjacency, treats the supplied boundary nodes as cuts, and traces unclaimed components into each region in input-to-output order. It constructs temporary metadata views for matching, without calling `nodal()` again or introducing network blocks.

Each region runs through the existing ORI board operations. The composer translates the next board so its matching interface wire endpoints meet the preceding board's endpoints. All shared endpoints must agree on the translation and placement grid; incompatible spacing or ordering reports an error. The first implementation does not stretch symbols, rescale arms or route between incompatible interfaces. Tile IDs are namespaced by section so separate corner boxes remain distinct. The merged model has one set of labels and node numbers, only the final network's external ports, and `graph.board.sections` describing the regions. All component occurrences must be accounted for exactly once. The tests also exercise surrounding series and ladder sections and data-only board aliases; this operation does not recognize a divider/combiner by its RF name.

Symbol dimensions use a **20-unit construction module**, with a **10-unit placement grid** for terminals, anchors and wires. Ordinary canonical pins remain **20 units**; finer internal artwork coordinates are allowed where curves, zigzags or plate gaps require them. A 100-unit resistor has a midpoint 50 units from either terminal. The finer grid permits a transformer terminal axis to align with that midpoint without changing the resistor artwork.

Named-slot boards can declare a shared centerline as data:

```js
centerlines: [{
    axis: 'y',
    reference: {slot: 'bridge', between: ['top', 'bottom']},
    align: [
        {slot: 'input', port: 'in'},
        {slot: 'tap', port: 'center'}
    ]
}]
```

This relation aligns the input terminal and center tap with the vertical resistor's terminal midpoint. `alignBoardCenterlines()` translates the corresponding placed components and all their numbered ports before wires and external leads are generated. The relation takes precedence over the board's initial offsets. It uses no constructor-specific JavaScript. In the current transformer example, the input wire and resistor midpoint both have y = 610. The relation also works after reordering components or reversing their numbered ports. Incompatible centerline relations, or a requested translation off the placement grid, report an error.


## Two schematic workflows

nP has two related schematic workflows. The authoring workflow turns editable circuit descriptions into self-contained SVG files for the documentation site. The runtime workflow lets browser code call `nP.schematic(circuit)` for an nPort or `nP.schematic({transmitter, circuit, receiver})` for a simple signal path. Both describe the same electrical ideas, but they currently use different layout engines.

The schematic is a view of how components are connected. It does not calculate S-parameters or change the circuit. The RF constructors, `cas()`/`cascade()`, and `nodal()` build the nPort and record the information the runtime renderer needs. `schematic.js` reads that information. A guided nodal drawing passes it to ORI with the chosen board definition; an unguided nodal drawing uses the generic ORI board. Shared rendering then draws SVG.

## Sources of truth and generated artifacts

The **60 individual SVG files in [`schematics/symbols/`](../schematics/symbols/)** are the source of truth for canonical symbol geometry. They live at one directory level. [`schematics/symbol-catalog.json`](../schematics/symbol-catalog.json) maps public constructor names to those files, records the alternate `mbend()` drawing, and identifies the signal-flow symbols. [`schematics/svg-style-guide.md`](../schematics/svg-style-guide.md) specifies the grid, port order, colors, dimensions, and labeling rules.

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
schematicSymbols.js ────────────┐
nodalBlockSymbol.js ────────────┤
schematicShapeBoards.js ────────┼→ schematic.js → src/np-chart/index.js → src/index.js
schematicBoardInterpreter.js ───┘
        ↑
schematicBoardGraph.js (generic graph operations)
schematicBoardComposition.js (node-bounded board sections)
```

The same symbol-generation command writes `src/np-nport/src/schematicSymbolMap.js` from `schematics/symbol-catalog.json`. Each direct RF constructor calls `schematicPart(publicName, parameters)`; that helper reads the generated map, so constructor source does not repeat the SVG filename. The catalog gives `mbend()` explicit `left` and `right` variant keys. `symbols:check` and both Rollup builds instantiate all 51 direct RF constructors and compare each returned nPort's port count and symbol ID with the runtime symbol. `lpfGen()` inherits its cascade metadata from `paC()` and `seL()`.

`npm run build` regenerates `schematicSymbols.js`, then runs Rollup from `src/index.js` and writes three tracked distributions:

| File | Format and use |
| --- | --- |
| `dist/nP.js` | UMD browser bundle; exposes the global `nP` object. |
| `dist/nP.esm.js` | ES module package import. |
| `dist/nP.cjs` | CommonJS package import. |

The bundles include the renderer, ORI and its shared graph/composition operations, board definitions and runtime symbol geometry. The browser does not fetch canonical SVGs or separate shape-definition files when `nP.schematic()` runs. The REPL loads a copy of `dist/nP.js` at `docs/public/nP.js`; that copy must be refreshed after browser behavior changes. The separate `src/plugin.js` entry point also re-exports `np-chart`, so `npm run build:plugin` can build the schematic API into `dist/nP.plugin.esm.js` when that separately maintained bundle is updated. The npm package's declared public files are the three main `dist/nP.*` bundles, not the canonical SVG directory or the plugin bundle.

## Public API and source-module functions

Only `schematic` is exported through `src/np-chart/index.js` as `nP.schematic`. The other three functions below are exported by `schematic.js` for direct source-module use; they are **not** `nP.schematicGraph`, `nP.schematicTopology`, or `nP.schematicSvg`.

| Function | Result |
| --- | --- |
| `nP.schematic(circuit, options)` | Builds the RF circuit model, mounts an SVG and controls, and returns `{svg, graph, topology, error}`. On success, `error` is null. `svg` is the mounted DOM element. |
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

## Generic board and specific shape guidance

For a nodal network, `nP.schematic(network)` now selects the **generic board** in `schematicShapeBoards.js` and runs ORI. Supplying `shapes: ['series']`, `['ladder']`, `['bridgedT']`, `['edgeCoupledFilter']`, `['branchline']`, `['powerDivider']` or `['powerCombiner']` selects a more specific board using the same interpreter. The generic route does not try these RF patterns or choose a shape by constructor names.

The generic board declares left-to-right flow, downward branches, rectangular loop arrangement, the 10-unit grid, component spacing, wire escape length, corner size and routing policy. `schematicBoardGraph.js` implements shared graph operations used by ORI for this policy. It contains no transformer-divider, Wilkinson or other RF-circuit matcher.

For an unbranched chain of two-port components, ORI reuses its repeated component/wire tile operation. Canonical bend symbols change the following tiles' direction, just as they do with the explicit series board. This is a connectivity check, not a search for a named RF circuit.

Other networks form a component/node incidence graph. An iterative Tarjan decomposition finds biconnected edge blocks; blocks with cycles become loop regions. Regions sharing a component are merged so the component is drawn once. The remaining components become individual placement regions. BFS orders these regions from the input side; the board's flow and branch directions map this order onto the drawing. Members of cyclic regions occupy a rectangular perimeter. This gives a closed-loop arrangement even when the electrical graph has chords or several paths, but it does not promise the familiar RF arrangement of every such network.

Canonical lead directions guide each symbol's quarter-turn orientation and reflection. Every terminal gets an outward wire escape before obstacle routing begins, avoiding the earlier failure caused by starting a route inside a padded symbol box. A priority-queue graph search routes between escape points on the grid, with Manhattan distance guiding the search and a bend cost favoring fewer turns. Different nodes may cross at straight segments but cannot share a collinear wire segment. Actual shared-node branches receive junction dots; foreign-node crossings receive crossover gaps. The generic operation emits the same component, wire and corner boxes used by the other ORI operations.

ORI tries the common annotation search first. If its bounded candidate search fails, a shared spacing fallback searches farther out for readable positions. This fallback is available to guided boards as well as automatic boards; a dense label group does not by itself invalidate a matched shape. An unfamiliar but connected diagram is a useful starting point; selecting a specific engineering shape remains the way to request a familiar arrangement.

The generic route applies to nodal networks, including nested networks drawn as blocks. All node-bounded sections, including series followed by ladder, use ORI's shared board composition. Cascade and signal-path rendering retain their separate series layouts.

The 32 circuits in [`dev/schematic.html`](../dev/schematic.html) provide default-layout exposure. The individual explicit-shape pages remain under [`dev/shapes/`](../dev/shapes/). The transformer page [`dev/trf5Port.html`](../dev/trf5Port.html) can be compared with and without its `powerDivider` hint.

[`dev/shapes/powerDivider.html`](../dev/shapes/powerDivider.html) shows the Wilkinson variant using ideal lines, microstrip symbols, and unequal component counts in its arms. All three request `shapes: ['powerDivider']`.

Its fourth example connects a divider, combiner and LC ladder in one nodal network. Nodes 40 and 41 join the first two regions; node 50 joins the combiner to the ladder. Three guided boards render all seventeen component occurrences together.

[`dev/shapes/powerCombiner.html`](../dev/shapes/powerCombiner.html) shows transformer and Wilkinson arrangements facing the other way, including microstrip symbols and unequal arm component counts. All four request `shapes: ['powerCombiner']` through the shared reference/reflection operation.

[`dev/shapes/bridgedT.html`](../dev/shapes/bridgedT.html) shows resistive and multi-component bridges, four-port junctions, repeated bridged sections and microstrip parts. Each network uses one `nodal()` call and requests `shapes: ['bridgedT']`.

[`dev/shapes/edgeCoupledFilter.html`](../dev/shapes/edgeCoupledFilter.html) shows ideal/microstrip staircases, a vertical flip, seven-section repetition and alternative terminations. The older top-level edge-coupled noise-analysis harness remains unchanged.

For line-based ladders, a runtime symbol may declare its through and shunt port numbers in `schematics/runtime-symbol-layout.json`. Both `Tee()` and `mtee()` use ports 2 and 3 for the main path and port 1 for the shunt. ORI tests 90-degree rotations and reflections against the actual port coordinates, choosing one that advances the main path rightward and points the shunt downward. Two-port parts such as `Tlin()` and `mlin()` are oriented by their input and output ports. A one-port termination is oriented from its port toward its body, so `Short()`, `Open()`, and the physical microstrip `mvgnd()` can sit at the bottom of a shunt without a constructor-specific angle.

For a guided branchline, the renderer contracts each chain of two-port arm components into an edge between three-port junctions. ORI expands the rows and lanes declared in the board data and assigns junctions to those slots by their connections and external-port assignments. It checks every declared lane against an actual arm. Every component and edge must belong to that rectangular chain. The count of columns gives the cell count; a one-cell ring has one independent cycle, while adjacent cells add cycles. The layout places junctions on a rectangular grid, distributes the actual arm components along each edge, and chooses each symbol's 90-degree rotation or reflection from its connected port directions. The graph reports `layout: 'branchline'`, `shape: 'branchline'`, and `cells`. This uses the same canonical symbols as the rest of the renderer and does not depend on a component-name pattern.

The printable previews in [`schematics/shapes/previews/`](../schematics/shapes/previews/) are visual references. The seven current named nodal shapes and their variants are serializable data in `src/np-chart/src/schematicShapeBoards.js`. `schematicBoardInterpreter.js` interprets that data; `schematic.js` supplies common geometry, annotations and SVG rendering. There are no separate JSON definition files.

Signal-path drawings require the transmitter and receiver to be passed explicitly because the nPort's RF construction metadata does not know which downstream receiver was created. MOD and DEMOD connectors represent functional signal flow; they are not nPort S-parameter ports. The RF circuit between them retains its usual component metadata and numeric behavior.

The following source-module functions support the current routes. ORI functions marked **(Outside schematic.js)** are defined in `schematicBoardInterpreter.js`; the generic graph operations are in `schematicBoardGraph.js`. The earlier table describes the resistor example; this table also includes operations used by the other shapes and the unguided layouts.

<table>
  <thead><tr><th>Function</th><th>Job</th></tr></thead>
  <tbody>
    <tr><td><code>buildSchematicModel()</code></td><td>Dispatches nodal, cascade or signal-path metadata.</td></tr>
    <tr><td><code>buildNodalModel()</code></td><td>Selects ORI for every nodal drawing: the generic board, a registered single shape or composed board sections.</td></tr>
    <tr><td><code>buildInterpretedBoardModel()</code></td><td>Adapts ORI geometry to the public drawing graph, adds annotations, and returns topology.</td></tr>
    <tr><td><code>layoutAutomaticBoard()</code><br>(Outside schematic.js)</td><td>In schematicBoardGraph.js. Decomposes the network into regions, places symbols and builds generic board wire routes.</td></tr>
    <tr><td><code>interpretSchematicBoard()</code><br>(Outside schematic.js)</td><td>ORI entry point in schematicBoardInterpreter.js; interprets board features rather than selecting by an RF shape name.</td></tr>
    <tr><td><code>reflectBoardResult()</code><br>(Outside schematic.js)</td><td>Applies a referenced board's axis reflections to complete bound geometry before annotation placement, preserving numbered terminals.</td></tr>
    <tr><td><code>reflectBoardPoint()</code><br>(Outside schematic.js)</td><td>Reflects a coordinate or offset across the declared axes; shared by component, wire, node and external-port geometry.</td></tr>
    <tr><td><code>composeSchematicBoards()</code><br>(Outside schematic.js)</td><td>Shared operation in schematicBoardComposition.js: isolates node-bounded regions, interprets their existing boards, aligns compatible interfaces and merges geometry without network blocks.</td></tr>
    <tr><td><code>unusedBoardPorts()</code><br>(Outside schematic.js)</td><td>Enumerates junction terminals outside a bound main path's through-port pairs.</td></tr>
    <tr><td><code>bindBoardLinks()</code><br>(Outside schematic.js)</td><td>Binds declared rejoining connections and reserves their components and endpoints before terminated attachments are traced.</td></tr>
    <tr><td><code>traceBoardLink()</code><br>(Outside schematic.js)</td><td>Follows two-port components from an unused path port to another unused port, preserving numbered terminals.</td></tr>
    <tr><td><code>boardPathSpacing()</code><br>(Outside schematic.js)</td><td>Measures rejoining path spans and increases flexible main-path wire boxes in grid steps when needed.</td></tr>
    <tr><td><code>placeBoardLinks()</code><br>(Outside schematic.js)</td><td>Allocates perpendicular tracks for rejoining paths and reuses the tile and corner-wire operations to connect their actual anchors.</td></tr>
    <tr><td><code>placeBoardPaths()</code><br>(Outside schematic.js)</td><td>Applies path-spacing constraints, including optional previews to measure attachment clearance, then invokes bound-path placement.</td></tr>
    <tr><td><code>placeBoundBoardPaths()</code><br>(Outside schematic.js)</td><td>Places repeated main-path tiles, attached paths and rejoining paths using the selected board's shared operations.</td></tr>
    <tr><td><code>placedBoardTerminalDirection()</code><br>(Outside schematic.js)</td><td>Transforms a canonical terminal lead into the outward attachment direction without exchanging numbered ports.</td></tr>
    <tr><td><code>bindBoardPaths()</code><br>(Outside schematic.js)</td><td>Binds through paths and attached terminating paths to actual component occurrences.</td></tr>
    <tr><td><code>expandBoardTiles()</code><br>(Outside schematic.js)</td><td>Expands component repetitions and intervening wires.</td></tr>
    <tr><td><code>placeBoardTiles()</code><br>(Outside schematic.js)</td><td>Places a sequence of wire and component boxes, optionally fitting between two fixed terminals.</td></tr>
    <tr><td><code>collectBoardConnections()</code><br>(Outside schematic.js)</td><td>Contracts chains between eligible anchors into a graph with the endpoint port numbers retained.</td></tr>
    <tr><td><code>expandBoardSlots()</code><br>(Outside schematic.js)</td><td>Expands rows, columns, lanes and external-port cells from board data.</td></tr>
    <tr><td><code>assignBoardSlots()</code><br>(Outside schematic.js)</td><td>Uses constrained backtracking to bind actual anchors to the expanded cells.</td></tr>
    <tr><td><code>fitBoardTiles()</code><br>(Outside schematic.js)</td><td>Fits a lane by distributing slack into its first and last real wire boxes.</td></tr>
    <tr><td><code>bindBoardSlots()</code><br>(Outside schematic.js)</td><td>Binds named component slots and port roles using the declared wire connections.</td></tr>
    <tr><td><code>placeNamedBoardSlots()</code><br>(Outside schematic.js)</td><td>Places slots from terminal references and cell offsets, then applies centerlines and creates wire routes.</td></tr>
    <tr><td><code>alignBoardCenterlines()</code><br>(Outside schematic.js)</td><td>Aligns named terminal axes or midpoints before routing, with grid and conflict checks.</td></tr>
    <tr><td><code>appendCornerBoardWire()</code><br>(Outside schematic.js)</td><td>Builds straight and corner wire boxes while leaving node dots off corners.</td></tr>
    <tr><td><code>flattenCascade()</code></td><td>Flattens a cascade while keeping completed nodal operands as blocks.</td></tr>
    <tr><td><code>blockViewTree()</code></td><td>Selects completed cascade operands as blocks for the blocks view.</td></tr>
    <tr><td><code>placeComponents()</code></td><td>Places cascade and signal-path series drawings using the existing series layout.</td></tr>
    <tr><td><code>nodalLoopAnalysis()</code></td><td>Builds a spanning forest and reports independent cycles for the returned electrical topology.</td></tr>
    <tr><td><code>renderNodalSvg()</code></td><td>Turns the completed drawing graph into SVG using bundled canonical artwork.</td></tr>
  </tbody>
</table>

## The underlying theory of schematic.js

The goal of `nP.schematic()` is an RF schematic an engineer can recognize: a series path reads left to right, a filter ladder has a clear main path and downward shunts, a coupler reads as a loop or rectangular branchline, and ports and junctions remain unambiguous. Graph algorithms help the renderer understand connectivity and route wires. RF drawing conventions come from the layout rules, symbol port metadata, and any shape guidance passed by the caller. A graph algorithm by itself does not know that a particular circuit should look like a ladder or branchline.

Keep the two-resistor example at the start of this note in mind. Its electrical description says `r1` joins nodes 1 and 2, `r2` joins nodes 2 and 3, and external ports are nodes 1 and 3. The expected drawing is a simple horizontal chain. The graph theory below explains how the code recognizes and lays out that chain, then how the same connectivity machinery supports less obvious RF networks.

| RF drawing an engineer expects | Connectivity clue the renderer uses | Layout behavior |
| --- | --- | --- |
| Series network | A two-port path joins external port 1 to port 2 | Place the path left to right and orient each part's through ports along it |
| Ladder filter | A main through path has tee-led branches ending in opens, shorts, or loads | Keep the through path horizontal and draw shunts vertically from the actual tee ports |
| Tree-shaped feed or measurement circuit without a hint | Loop-free regions connect through actual electrical nodes | Generic ORI orders regions from the input by BFS, places symbols and routes their numbered terminals |
| Parallel paths or junction network without a hint | Multiple paths form a cyclic incidence-graph region | Generic ORI groups the cyclic region and places its members on a rectangular perimeter before routing |
| Loop without a hint | Low-link analysis identifies a cyclic block | Generic ORI places the region on a rectangular perimeter; a named board supplies more specific engineering intent |
| Branchline coupler | Junctions and arm chains fit the rows, lanes and external ports declared in the board | ORI matches anchors to board cells and fits the actual arm components between their numbered terminals |
| Transformer power divider | Five component slots and their numbered-port connections fit the transformer board | ORI places the named roles, aligns the input and bridge centerlines, and routes straight/corner wire boxes |
| Network drawn without a shape hint | The caller supplies connections without a named board | Use the generic board's graph regions and obstacle routing; connectivity alone does not imply every RF drawing convention |

The guided rows describe specific ORI boards. The unhinted rows describe the generic board's graph regions and routing. A topologically valid route can still look unfamiliar. A shape request supplies visual intent when connectivity alone leaves multiple plausible drawings. A conflicting explicit hint reports an error rather than silently choosing the generic board.

An RF circuit has **components, ports, and electrical nodes**. A supported constructor supplies a component with ordered ports and attaches a `_schematic` record naming its drawing symbol and relevant values. A node number in `nodal()` identifies one electrical connection shared by every listed port with that number. This is a connectivity statement, not a coordinate. Several ports can share one node even if their symbols are drawn far apart.

The renderer keeps two models separate:

- **Topology** records which component ports share each node or which cascaded ports connect. For nodal circuits, a node can join more than two ports. For cascades, the binary construction tree records how intermediate nPorts were assembled.
- **Drawing graph** assigns coordinates, rotations, wires, labels, node circles, and a `viewBox` to a selected visual layout of that topology. Different drawings can represent the same topology.

`nPort.cas()` records `{kind: 'cascade', left, right}` using the two operands' metadata. `nP.cascade()` builds through `cas()` and preserves the tree. `nP.nodal()` records its component entries as `{part, nodes}` and stores the external node order. This metadata travels with the returned nPort; the renderer does not infer a circuit from its numeric S matrix. Reusing one component object in separate connections creates separate placements with the same part metadata.

For a nodal network, `topology.loopAnalysis` describes cycles in the actual connections. The detector treats each component row and each electrical node as a vertex, with one edge for every numbered component port; external ports do not add edges. It builds a spanning forest and reports each `closingEdges` entry that connects vertices already joined. `cycles` lists the tree path plus that closing edge for each independent cycle. An edge is `{component, port, node}`: `component` is the one-based position of the component row in `nodal()`, and `port` is the component's one-based port number. `hasLoops` is true when any closing edge exists. For an RF engineer inspecting the returned topology, this distinguishes a tree from a network with cycles. The generic layout derives its cyclic regions separately using low-link analysis. It does not, on its own, specify whether the drawing should be a branchline, a rat race, a bridge, or some other recognizable form. The board definition establishes that visual pattern for a guided drawing.

### Cascade flattening and series placement

`flattenCascade()` recursively walks the binary cascade construction tree in left-to-right order, producing the two-port series chain. A completed two-port nodal network is kept as one `nodal` block. With `view: 'blocks'`, `repeatedCascades()` counts cascade objects by identity and `blockViewTree()` replaces repeated subtrees with block symbols at their occurrences. If no repeated subtree exists, nested cascade operands directly below the root are still shown as blocks; leaf components remain individual symbols.

`placeComponents()` places the chain greedily along its current direction, normally left to right. It rotates each symbol by 90-degree steps so its entry port faces the direction of travel. It tries successive gaps on the 10-unit grid and takes the first placement whose body bounds clear earlier bodies and wires, and whose connecting segment does not run through an earlier body. This is a local placement rule, not a global search for the best arrangement.

### Discrete annotation placement

In layouts that use the annotation search, component labels, external-port labels, and node-number circles receive candidate positions at increasing distances from the related symbol or node. Candidate order and cost prefer the side that suits the symbol's aspect ratio, then favor smaller offsets and distances. `annotationOptions()` removes collisions and retains up to 32 low-cost options. `chooseAnnotations()` expands partial assignments, rejects overlaps, and keeps the 96 lowest-cost states at each step. This is beam search for discrete annotation placement, closely related to point-feature label placement in cartography. ORI follows a failed bounded search with the shared wider spacing fallback.

### Nodal layout strategy

An explicit `options.shapes` request is checked first. Supported named boards are `series`, `ladder`, `bridgedT`, `edgeCoupledFilter`, `branchline`, `powerDivider` and `powerCombiner`. Node-bounded sections can compose boards with compatible interfaces. The scalar-bounded series/ladder pair uses the same ORI composer as other sections. The `powerDivider` family checks its transformer and Wilkinson descriptions against the component and node connections; `powerCombiner` references that family and reflects its geometry. Each request validates that the actual connections fit; a mismatch throws an error rather than silently selecting another shape.

Without a shape request, a nodal network uses the generic ORI board. Its graph decomposition and routing sequence is described in section 4 below. The former flow, tree, parallel, junction-path, single-loop and graph fallback builders have been removed. `buildNodalModel()` now has one interpreter route for every nodal drawing.

### Graph algorithms and routing

This section separates standard computer-science ideas from the particular way `schematic.js` uses them. The word **graph** appears several times because the renderer builds different graphs for different jobs. The electrical incidence graph used to detect cycles, the anchor graph matched to board slots, and the coordinate grid searched for an unguided wire route serve different purposes.

#### 1. The ideas outside nP

In graph theory, a graph is a set of **vertices** joined by **edges**. A path is a sequence of edges joining vertices. A cycle is a path that returns to its starting vertex without repeating its other vertices. A **connected component** is a maximal group of vertices that can reach one another. A **tree** is a connected graph with no cycles; a **forest** is a collection of trees. For a graph with $V$ vertices, $E$ edges, and $C$ connected components, the number of independent cycles is $E - V + C$. “Independent” means every other cycle can be formed by combining these cycles; the graph may contain many more possible closed walks.

An electrical circuit has a natural graph representation. One common representation puts electrical junctions at vertices and two-terminal parts at edges. nP's cycle detector uses a closely related **incidence graph**: component instances and electrical nodes are both vertices, and each component terminal is an edge between its component vertex and the node it touches. A two-terminal resistor therefore appears as a two-edge path through the resistor vertex. This representation also handles a multiport part: it is one component vertex connected to one node vertex for each of its ports.

Circles in a graph picture stand for abstract vertices; lines stand for relationships. Their page positions carry no physical meaning until a layout algorithm assigns drawing coordinates.

##### Disjoint sets, spanning forests, and cycles

**Disjoint-set union**, also called **union-find**, is a data structure for tracking which vertices have already become connected as edges are processed. Initially, every vertex is in its own set. `find(v)` returns the representative of the set containing `v`. When an edge joins vertices with different representatives, `union(a, b)` merges their sets. When both endpoints already have the same representative, the new edge joins vertices that are already connected; adding it to the selected edges would close a cycle.

For the engineer, the output is useful because it separates networks that can be drawn as trees from networks that need a cycle-aware layout. A series resistor chain produces no closing edge; adding a second path between the same nodes does. The current generic ORI operation decomposes the incidence graph into cyclic blocks using low-link analysis. Both current ORI routes attach union-find loop analysis to the returned topology after placement. It does not determine component placement or select an RF pattern by name.

<p><a href="https://courses.cs.washington.edu/courses/cse373/24sp/lessons/graph-algorithms/"><img src="https://courses.cs.washington.edu/courses/cse373/24sp/assets/images/kruskals-algorithm.webp" alt="University of Washington graph algorithms diagram showing union-find cycle detection" style="max-width: 620px; width: 100%;"></a></p>

Read the two cases in this University of Washington diagram as “different sets: join them” and “same set: this edge closes a cycle.” The renderer uses that same decision to build a **spanning forest**: it keeps the edges that first connect separate sets and records later edges as closing edges. A spanning forest reaches every vertex in each connected component while containing no cycles.

For each closing edge, the already-selected forest has exactly one path between its endpoints. That forest path plus the closing edge is a **fundamental cycle**. The selected forest depends on the order in which edges are examined, so the particular fundamental cycles can differ with edge order. Their count, $E - V + C$, does not. Union-find answers the fast “already connected?” question; a search through saved tree edges recovers the actual path needed to describe each cycle.

**Worked example: series resistors versus parallel resistors.** For two resistors in series, the incidence graph is a chain:

```text
N1 — R1 — N2 — R2 — N3
```

Each line is one numbered resistor port attached to one electrical node. When the four port-edges are processed, each edge joins two previously separate sets. No edge closes a cycle, so `hasLoops` is false. For two resistors in parallel, both resistors touch the same two nodes:

```text
       R1
      /  \
    N1    N2
      \  /
       R2
```

In the incidence graph, the sequence `N1—R1—N2—R2—N1` is a cycle. For example, after the first three port-edges connect `N1`, `R1`, `N2`, and `R2` into one set, the final `R2`-to-`N2` port edge finds both endpoints already in that set. It is the closing edge. The path already in the forest is `R2—N1—R1—N2`; adding the closing edge makes the rectangular fundamental cycle. The resistor values do not enter this test. It is purely a test of the stored connectivity.

##### Breadth-first search (BFS) and depth-first search (DFS)

Both BFS and DFS explore a graph from a starting vertex while remembering which vertices have been visited. They answer reachability questions and can build a predecessor tree. BFS uses a first-in, first-out queue: it visits everything one edge away, then everything two edges away, and so on. In an unweighted graph, the first time BFS reaches a vertex is along a path with the fewest edges. DFS follows one available route as far as possible, then backs up to try another route. DFS is useful for finding a path; its first path is not generally the shortest.

In a schematic, DFS answers “can I trace a through path from input to output using these parts?” BFS answers “what is the fewest number of graph steps to this other junction or component?” Those are different RF layout questions. `traceBoardPath()` in ORI uses an explicit stack for DFS to bind a board path. Symbol metadata and any terminal pairs declared by the board determine the allowed through ports. The generic board uses BFS to order regions and a priority-queue search with a Manhattan heuristic for wires. ORI's connected boards use constrained slot matching rather than a BFS search for upper and lower rails.

<p><a href="https://commons.wikimedia.org/wiki/File:Breadth-First-Search-Algorithm.gif"><img src="https://upload.wikimedia.org/wikipedia/commons/5/5d/Breadth-First-Search-Algorithm.gif" alt="Animated breadth-first search showing its expanding frontier" style="max-width: 440px; width: 100%;"></a></p>

In this animation, follow the visited frontier outward from the start. The queue is the frontier waiting to be expanded; a predecessor record remembers which earlier vertex first reached each new vertex. Following those predecessor links backward from a destination reconstructs a shortest unweighted path. BFS runs in $O(V+E)$ time with adjacency lists because each vertex and edge is examined a bounded number of times. The [Aalto University BFS notes](https://tarjotin.cs.aalto.fi/CS-A1140/2021/notes/graphs-bfs.html) walk through this queue, distance, and predecessor model.

##### Matching a board template to a connection graph

A template-matching problem has variables, candidate values and constraints. A variable might be “the junction in the upper-left board cell.” Its candidate values are actual junction occurrences in the network. A constraint might require that this junction touches external port 1, connects to two neighboring cells, and occupies a different cell from every other junction. The template specifies the intended arrangement; the graph supplies which assignments are electrically possible.

**Backtracking** tries a candidate assignment, propagates its consequences, and backs up when a constraint cannot be met. A useful choice is to assign the variable with the fewest remaining candidates first. An external port may fix a corner immediately; its connected neighbors then have fewer candidates. This prunes the search. It does not make all matching problems cheap: ambiguous large templates may still require many alternatives.

For a rectangular RF network, it is useful first to **contract paths**: replace an entire chain of two-port components with one temporary graph edge between junctions. Keep the original ordered parts and endpoint port numbers attached to that edge. The smaller graph can be matched against a rectangular board; afterward the actual parts expand back into each lane. Contracting for matching neither removes components from the drawing nor changes their electrical connections.

Named component slots use the same constraint idea at a different level. “Upper output tee” is a role, not a JavaScript variable name. Candidate assignments must connect its common port to the bridge and its through ports to the transformer and external output. Candidate numbered-port alternatives are tested against the network. After binding, layout uses those resolved port numbers, so changing a drawing's rotation cannot silently exchange terminals.

These concepts describe ORI's `assignBoardSlots()` and `bindBoardSlots()`. They establish which components fill the supplied pattern. The board's placement rules still determine where those roles appear. A successful connection match alone supplies no preferred RF geometry.

##### Grid maze routing (Lee's algorithm)

Maze routing turns a drawing area into another graph. Every allowed grid point is a vertex. An edge joins horizontally or vertically adjacent points, and blocked cells or points are removed. A wire route is then a graph path from one terminal to another. With equal cost for every grid step, BFS expands in distance waves from the start. Once it reaches the destination, predecessor links recover a shortest Manhattan route. This is the central idea of Lee-style routing, used in electronic-design automation; the method is complete inside its search region, meaning it finds a path if one exists in that region. Its cost is that it may explore many grid points, and shortest routes can have many bends.

The RF drawing role is narrow and concrete: after symbols have positions, connect terminals that share a node without running a wire through a symbol body. The grid router does not decide where the resistor, tee, coupler, or amplifier belongs in an engineering diagram. It solves wire geometry for a placement already chosen by another layout rule.

<p><a href="https://mediatum.ub.tum.de/doc/1748609/3om72w8m40klvkmb5wwjf3q97.LSYM_Compendium.pdf#page=72"><img src="https://image1.slideserve.com/1691807/the-lee-s-algorithm-1-front-wave-expansion-phase2-l.jpg" alt="Lee maze-routing grid with the wavefront expanding around blocked cells" style="max-width: 620px; width: 100%;"></a></p>

Think of the numbered cells as distances from the source. The wave cannot pass through blocked cells. When it reaches the target, tracing through neighboring cells with successively smaller distance values walks back to the source. The nP router has a related implementation; its exact behavior is described below. The [Technical University of Munich electronic-design-automation notes](https://mediatum.ub.tum.de/doc/1748609/3om72w8m40klvkmb5wwjf3q97.LSYM_Compendium.pdf#page=72) explain the grid graph and wave/backtrace phases in more depth.

##### Beam search for labels

Label placement is a constrained search problem. Suppose each component label has several possible positions. A complete solution chooses one position for every label while avoiding overlap with symbols, wires, node labels, and other text. Searching every combination grows exponentially: if there are $n$ labels and $k$ candidate positions per label, there can be $k^n$ assignments.

This is a drafting-quality step rather than a connectivity step. It tries to keep values, reference labels, port numbers, and node numbers legible around the electrical drawing. It cannot correct a poor circuit layout; it only searches among text positions around the layout it receives.

Beam search processes one label at a time. It expands each currently retained partial assignment by trying the next label's candidates, rejects assignments that collide, scores the rest, and keeps only the best $B$ partial assignments. The beam width $B$ trades search time for the chance of finding a good arrangement. Because discarded assignments are not reconsidered, beam search is a heuristic; it can miss a globally best or even a feasible arrangement that would require preserving a temporarily costly choice.

<p><a href="https://liyingbo.com/stat/2025/05/24/cs221-artificial-intelligence-notes-on-variables-week6-8/"><img src="https://liyingbo.com/figures/cs221/week6_beam_search.png" alt="Beam search diagram retaining only the best partial assignments at each level" style="max-width: 620px; width: 100%;"></a></p>

The picture shows a search tree of partial assignments. At each level, only a fixed number of the lowest-cost partial solutions survive. In a map, each label is associated with a geographic feature; in a schematic, each label is associated with a component or node. The underlying point-feature label-placement problem is studied in cartography, where candidate positions and overlap penalties are formalized as an optimization problem ([Haunert and Wolff, 2016](https://isprs-archives.copernicus.org/articles/XLI-B2/109/2016/)).

#### 2. The data structures inside nP

`schematic.js` and ORI derive their graph inputs from the nPort's `_schematic` construction record. It does not recover a schematic from the S-matrix. The main structures are:

| Structure | What it represents | Why the renderer needs it |
| --- | --- | --- |
| `root.components` | Ordered component instances, each with its `part` and the node attached to each numbered port | Keeps electrical connectivity and symbol identity together |
| ORI `adjacency` map | Electrical node → component-row index and numbered port records | Traces paths and checks terminal incidence without assigning coordinates |
| Path `bindings` and `used` sets | Ordered component occurrences with `index`, `inputPort`, `outputPort`, and consumed-component records | Expands variable component counts and prevents silently omitted or duplicated parts |
| Contracted connection graph | Anchor component indices joined by edges carrying ordered two-port chains and endpoint ports | Matches the connected board without treating every arm component as a separate corner |
| Expanded board slots and links | Row/column cells, repeated lanes, and external-port cells | Represents the shape's intended arrangement before network occurrences are assigned |
| Slot assignment maps | Board cell or named role → actual component-row index, with resolved port roles where applicable | Relates engineering layout intent to exact network instances |
| Expanded `tiles` arrays | Concrete wire and component instructions after repetition | Lets one placement operation handle differently populated paths and lanes |
| Temporary ORI result | `placements`, `wires`, `nodePoints`, `externalPorts`, and lookup maps such as `byIndex` | Holds geometry before shared annotation and drawing-graph assembly; it is not another public graph |
| Generic block records | Biconnected incidence-edge blocks with depth and low-link values | Separates cyclic regions from tree connections without recognizing named RF circuits |
| Region positions and route occupancy | Placement centers, escape points, occupied wire axes and net IDs | Gives the generic operation room for symbols and prevents accidental collinear net joins |
| Component-node incidence graph | Component-row vertices, electrical-node vertices, one edge per component port | Detects connectedness and independent cycles, including multiport components |
| `parent` array in `nodalLoopAnalysis()` | Union-find parent links used to find each vertex's current set representative | Detects whether a port edge joins separate regions or closes a cycle |
| `tree` adjacency lists | Only the selected spanning-forest edges, stored in both directions with port metadata | Lets `treeEdgePath()` recover the forest path that completes each fundamental cycle |
| `byNode` maps | For a node, the component/port terminals attached to it | Builds component adjacency, flow paths, junctions, wire endpoints, and port routing |
| Generic region BFS queue | Region frontier and graph-distance layers from the input side | Orders regions without assigning an RF circuit name |
| Coordinate-grid priority queue, `best` and `previous` maps | Candidate route states, best recorded coordinate costs and predecessor coordinates | Guides obstacle routing with Manhattan distance and bend costs, then reconstructs the selected route |
| Annotation search states | Partial sets of label positions, their total cost, and occupied bounds | Allows multiple labels to be positioned together while rejecting collisions |

Here, the incidence graph is a **topology model**. It says which ports share electrical nodes. The coordinate grid is part of the **layout model**. It says where a wire can be drawn around already-placed symbols. Moving a symbol changes layout coordinates, not electrical connectivity. ORI's slot and binding maps connect the board template to that topology; its temporary geometry becomes the drawing graph only after `buildInterpretedBoardModel()` finishes it.

#### 3. The order of use for a guided nodal drawing

The current explicit-shape call sequence crosses two main modules: `schematic.js` selects the definition and finishes the drawing model, and `schematicBoardInterpreter.js` interprets the board. The following stages apply to one of the seven named single-shape nodal requests.

1. **Read the network and board name.** `schematic()` calls `buildSchematicModel()`, which validates precision and options and dispatches the nodal `_schematic` record to `buildNodalModel()`. The selected data object comes from `schematicShapeBoards`. Node numbers and numbered component ports remain the source for electrical connections.
2. **Enter ORI through the common adapter.** `buildInterpretedBoardModel()` calls `interpretSchematicBoard()` with that data, the network record, the board registry, a symbol resolver, body-bound geometry, and common preview/placement services. These provide geometry for every shape; they are not layout functions inside a shape definition. A `use` reference resolves another definition before binding; a reference cycle is an error. A requested `flipVertical` adds a reflection to the definition before interpretation.
3. **Build electrical adjacency and check coverage conditions.** ORI verifies the language version, external-port count, distinct external nodes and agreement between symbol ports and network rows. It constructs the node-to-terminal adjacency map. Its current board operations require each wire node to join two terminals when external terminals are counted; a multiway junction is represented by an explicit junction component such as a tee. This is a current interpreter restriction, not a restriction on what `nodal()` can simulate.
4. **Bind the network using operations requested by the data.** A family with `alternatives` tries its data definitions in order. A definition with `match.slots` uses named-slot matching. A definition with `board.rows` or `board.anchors` uses connected-board matching. Other current definitions use path matching, then any declared rejoining connections, then terminated attachments. ORI chooses these operations from language features, not from a comparison with names such as `branchline` or `powerDivider`.
5. **Expand and place the board.** Repetitions expand into actual boxes. Canonical port geometry determines rotations and reflections. Lane lengths include the real symbols and wire boxes; fixed-end lanes distribute remaining space into their end wires. All transformed terminals must satisfy the 10-unit placement grid.
6. **Apply declared centerlines and create the routes.** Named-slot placement first establishes initial relative positions, then `alignBoardCenterlines()` translates the declared members into alignment. External leads and straight/corner routes are generated from the resulting terminals. Path and connected-board operations generate their wires while walking their fitted tiles. A referencing definition then applies its declared reflection to the completed geometry with `reflectBoardResult()`. These guided routes do not invoke the fallback maze router.
7. **Finish the drawing graph.** Back in `buildInterpretedBoardModel()`, shared code checks component bounds, creates annotation candidates, runs `chooseAnnotations()`, records circled node-number positions and labels, and calls `boardBoxes()` to expose the interpreted boxes. It computes the `viewBox` and assembles `model.graph`.
8. **Summarize the topology.** `flowTopology()` groups the placed occurrence IDs by their original electrical node assignments. It calls `nodalLoopAnalysis()` to attach the spanning forest, closing edges and cycles. In this guided route, that cycle analysis reports the topology after layout; it did not choose the shape.
9. **Render and mount.** `renderSchematicSvg()` dispatches the completed nodal model to `renderNodalSvg()`. The renderer reads `model.graph` and bundled symbol artwork and produces SVG. Public `schematic()` mounts that SVG, adds the toolbar and returns `{svg, graph, topology, error}`. On success, `error` is null.

The operation order within stage 4 and stage 5 depends on the board features:

| Current definition | Matching operations in order | Placement operations in order |
| --- | --- | --- |
| `series` | `bindBoardPaths()` → `traceBoardPath()` through two-port occurrences | `placeBoardPaths()` → `expandBoardTiles()` and `placeBoardTiles()` → orientation and wire creation |
| `ladder` | `bindBoardPaths()` traces the main path, then traces unused-port attachments to their terminations | Place main-path tiles with attachment directions, then reuse `placeBoardTiles()` for each attached path |
| `bridgedT` | Bind the main path → `bindBoardLinks()`/`traceBoardLink()` reserve rejoining paths → bind remaining terminated attachments | `boardPathSpacing()` grows flexible wire boxes → place main path and shunts → `placeBoardLinks()` allocates upper tracks using the existing tile and corner-wire operations |
| `edgeCoupledFilter` | Trace the data's numbered port pairs through coupled sections → bind direct one-port terminations at unused ports | Preview body clearance → place repeated tiles with lead-based orientation and downward advance → attach terminations along their own leads → optionally reflect upward |
| `branchline` | `collectBoardConnections()` → `expandBoardSlots()` → `assignBoardSlots()` | Measure terminal reaches and lane spans → choose board pitch → `orientBoardAnchor()` → `placeBoardTiles()` with `fitBoardTiles()` for each lane → external leads |
| Transformer `powerDivider` | `bindBoardSlots()` tries component and port-role candidates with `slotPortBindings()` and connection checks | `placeNamedBoardSlots()` resolves relative positions with `orientBoardSlot()` → `alignBoardCenterlines()` → external leads → `appendCornerBoardWire()` |
| Wilkinson `powerDivider` | `collectBoardConnections()` → named cells in `expandBoardSlots()` → `assignBoardSlots()` with lane predicates | `boardLanePitch()` measures each axis → `orientBoardAnchor()` → `placeBoardLane()` reuses tile placement and corner wires → external leads |
| `powerCombiner` | Resolve `use: 'powerDivider'` and bind the matching family alternative using the same operations | Place the referenced board → `reflectBoardResult()` reflects all geometry before common annotation placement |

These are shared language operations. The definitions supply component predicates, repetition, rows, links, terminal roles, layout relations and board references. None of the seven definitions supplies a JavaScript matcher or drawing callback.

```text
network metadata + board definition + canonical symbol geometry
                           |
                 interpretSchematicBoard (ORI)
                           |
               bindings → expanded boxes → geometry
                           |
                 shared annotations and board records
                           |
                   model.graph + topology
                           |
                     SVG renderer
                           |
                     SVG + toolbar
```

#### 4. The order of use for the generic board

The public path is the same ORI adapter as for a specific shape:

```text
schematic() → mountSchematic() → buildSchematicModel() → buildNodalModel()
    → schematicShapeBoards.generic → buildInterpretedBoardModel()
        → interpretSchematicBoard()
            → unbranched two-port chain: repeated component/wire tiles
            → otherwise: layoutAutomaticBoard()
                → incidence graph → cyclic regions → region positions
                → component orientation → outward terminal escapes
                → grid routes → wire/corner boxes + junctions/crossovers
        → annotations → drawing graph + topology
    → SVG renderer → mount drawing and toolbar
```

The chain case uses `bindBoardPaths()` and `placeBoardPaths()`, which already interpret the repeated tiles and symbol bend directions. For other connections, `graphIncidence()` records every numbered component port as an incidence edge. `graphBlocks()` uses depth and low-link values in an iterative Tarjan traversal to separate biconnected blocks. `automaticRegions()` extracts cyclic regions and merges those sharing a component. A shared electrical node alone does not become an artificial clique of cycles. `automaticPositions()` orders the resulting regions by BFS and places loop members on rectangular perimeters according to the board policy.

`automaticPlacement()` scores the allowed orientations against neighboring regions and external-port flow. `automaticRoute()` uses a priority queue, stored best costs, predecessor links and a Manhattan-distance heuristic to search around symbol bounds. It includes a bend cost as well as step distance. Its implementation retains one best record per coordinate, so it is a practical heuristic and does not claim an optimal route under direction-dependent bend costs. `recordBoardRoute()` tracks occupancy, allowing perpendicular crossings while preventing different nets from sharing the same wire segment.

`graphWireBoxes()` records straight and corner pieces, and `automaticJunctions()` identifies true same-node branches. The result returns to `buildInterpretedBoardModel()` for common annotations, board inspection records and topology. If annotation beam search fails, `chooseSpacedAnnotations()` searches additional clear positions for the generic board. Failures still propagate to the browser API's error boundary described below.

#### 5. Connectivity summary after layout

After ORI places the components and routes their wires, `buildInterpretedBoardModel()` calls `flowTopology()`. That helper groups the placed component occurrence IDs by their original node assignments and calls `nodalLoopAnalysis()` to attach the spanning forest, closing edges and fundamental cycles. `treeEdgePath()` recovers the forest path completed by each closing edge.

```text
ORI placements and routes
          ↓
buildInterpretedBoardModel()
          ↓
flowTopology() → nodalLoopAnalysis() → treeEdgePath()
          ↓
model.topology: parts, connections, loopAnalysis
```

This analysis remains active for guided and generic nodal drawings. It reports electrical structure after placement; it does not choose between RF layout builders. The generic board uses its own low-link decomposition before placement, while a guided board supplies the intended arrangement as data. There is no second nodal layout dispatcher behind ORI.

A valid electrical network can still exceed current placement, routing or annotation capabilities. Neither a shortest grid route nor a successful topology check guarantees a familiar RF arrangement. The browser error boundary reports a drawing failure while allowing subsequent JavaScript to continue.

These names describe algorithm families observable in the implementation. The external references above are learning resources and visual aids; they are not a claim that a particular publication was consulted as the source of the nP code.

### Symbol geometry, crossings, and output

`schematicSymbols.js` supplies generated SVG geometry, port coordinates, body bounds, lead segments, and optional flow metadata. Its canonical drawing source is [`schematics/symbols/`](../schematics/symbols/), with runtime placement details in [`runtime-symbol-layout.json`](../schematics/runtime-symbol-layout.json). `nodalBlockSymbol.js` uses the same symbol data to generate a rectangular block with the requested number and arrangement of ports; it is not the source of the individual component artwork. The runtime renderer imports these helpers directly and does not use ELK.

`rotateVector()` transforms port offsets in 90-degree steps. `nodalPlacement()` applies those rotations and optional X/Y reflections to each canonical port coordinate, so electrical port numbering remains attached to its symbol terminal. Layouts use the shared 10-unit grid, and the general wire router explicitly advances on that grid. ORI validates transformed terminals against the placement grid and distributes branchline lane slack in whole grid steps. Symbol geometry is transformed as a unit rather than snapping individual terminals and distorting the artwork.

`wireCrossings()` detects strict intersections between horizontal and vertical segments belonging to different nodes. `renderNodalSvg()` masks each crossing with a small white rectangle, then draws a straight horizontal segment over it. The crossover is therefore shown as a gap with a continuous straight line, not a hop arc.

`renderSchematicSvg()` builds SVG markup as a string and uses `escapeXml()` for displayed text. `schematicSvg()`, `schematicGraph()`, and `schematicTopology()` return the SVG markup, layout graph, and connection data without mounting the drawing; these are source-module exports. The public `schematic()` function mounts the SVG and toolbar, and returns `{svg, graph, topology, error}`. On success, `error` is null. PNG copy serializes the mounted SVG, draws it through an image and canvas, creates a PNG `Blob`, and passes it to the Clipboard API. A `ResizeObserver` updates a fitted drawing when its viewport changes. Component values in labels are formatted with `toPrecision()`; that formatting does not change the nPort values.

When a completed `nodal()` nPort is connected as one part of a larger nodal circuit, it appears as a `nodal` block. The canonical SVG is the two-port reference. `nodalBlockSymbol()` generates the same rectangular form for other port counts, with 20-unit leads and stable port numbering; its geometry can put individual ports on any of the four sides. The current automatic layout starts with port 1 on the left and the remaining ports on the right, then may rotate or reflect the whole block. The nested circuit's full `_schematic` connection record remains available. A top-level nodal circuit still expands to its component drawing.

An explicit ladder hint supplies the familiar horizontal main path with downward shunts for an RC low-pass network. A branchline hint supplies a rectangular ring. Without a hint, those networks, VNA circuits and other multiport arrangements all use ORI's generic regions and routing. The shared renderer draws the resulting graph; it does not select a second layout based on the circuit name.

## Boundaries and checks

`nP.schematic()` requires drawing metadata and a symbol bundled in `schematicSymbols.js`. Its signal-path form currently accepts a two-port RF component or cascade between a transmitter and an optional receiver. Other signal-flow blocks such as `FFT()` are canonical SVGs but do not yet have runtime layout support. The authoring composer handles broader signal-flow diagrams separately using named signal connections rather than RF node numbers.

The [network-only development harness](../dev/schematic.html) draws 32 direct and stress circuits through the public API. Its `dev/schematicStressCases.js` cases include loops and other nodal arrangements that exercise the general node router.

The generic operation is a first general layout rather than a guarantee of familiar RF drafting. It is tested against the existing development networks and their complete per-node wire connectivity. A particular valid network can still exceed its placement, routing or annotation capabilities; such a failure should appear as an inline message and leave subsequent browser JavaScript running.

Useful checks are `npm run symbols:gallery`, `npm run symbols:bundle`, `npm run symbols:check`, `npm run schematics:build`, and `npm run schematics:check`. `npm run build` is needed after changing runtime symbol data, board definitions, ORI or `schematic.js`; it regenerates the symbol module and must be followed by copying the browser bundle to `docs/public/nP.js` for the REPL. Visual inspection remains necessary for spacing, labels, and clarity even when structural checks pass.

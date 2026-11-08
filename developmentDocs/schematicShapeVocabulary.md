<!-- Modified: 2026-11-07 -->
# Schematic shape vocabulary

A shape name expresses an RF engineer's intended layout. The network's connections and the canonical component symbols remain the electrical and drawing facts; a shape guides how those facts are arranged. A network is the named nPort produced by `nodal()` or a cascade. Shape names describe engineering layout intent; their current definitions determine which connections and component counts the renderer can actually handle.

The implemented nodal board definitions live in [schematicShapeBoards.js](../src/np-chart/src/schematicShapeBoards.js). This note records their engineering meaning and current coverage. The shared [schematicBoardInterpreter.js](../src/np-chart/src/schematicBoardInterpreter.js), called ORI, interprets those data objects. They contain no shape-specific JavaScript matching or layout callbacks. [schematic.js](../src/np-chart/src/schematic.js) selects the board, finishes the drawing graph and renders SVG. The earlier shape JSON files are retired.

## Implemented boards

| Shape | Engineering layout intent |
| --- | --- |
| `series` | One continuous path of two-port nPort objects progresses from left to right, with no branches or loops. It accepts one or more components, including different component types and upstream two-port networks drawn as blocks. Bend symbols can change the following path's direction. The existing series-of-two-ports sketch is the visual reference. |
| `ladder` | A horizontal series path of two-port nPort objects has one or more downward shunt paths. A three-port junction such as `Tee()` or `mtee()` on the series path starts each shunt; its ports 2 and 3 carry the horizontal path and port 1 leads downward in the drawing. Each shunt contains two-port nPort objects and ends in an ideal or physical open, short, or load. The existing ladder sketch is the visual reference. |
| `bridgedT` | A horizontal main path has one or more upper bridges between junctions and one or more downward terminated shunts. Main sections, bridges and shunts can each contain multiple two-port objects. Supports three-port junctions and four-port junctions where a bridge and shunt share a main-path position. Disjoint bridges can share a level; enclosing bridges occupy outer levels. |
| `edgeCoupledFilter` | One or more ideal or microstrip coupled sections progress right and downward, with directly connected one-port terminations on the unused ports. `flipVertical: true` requests right and upward. Section count and node assignments come from the network. |
| `branchline` | One or more rectangular cells share vertical sides. Each cell has horizontal upper and lower arms and vertical side arms. Three-port junctions connect the arms at the corners; four external ports leave the outer corners. An arm can contain one or more two-port objects, so an added series resistor does not change the rectangular layout. The number of cells and every connection come from the network. |
| `powerDivider` | One input faces left and two outputs face right, with the output paths arranged above and below the input centerline. Currently supports the transformer and single-stage Wilkinson variants described below. Both are requested with the same shape name. |
| `powerCombiner` | Two inputs face left and the common output faces right. Reuses the transformer and single-stage Wilkinson divider descriptions with a reflection about the vertical axis. Port 1 remains the common port, port 2 is the upper input and port 3 is the lower input. |
| `generic` | The default nodal board when no shape is supplied. It attempts left-to-right flow, downward branching and rectangular loop regions from connectivity alone. It preserves electrical node assignments but can produce a large or unfamiliar drawing. It is a fallback, not a promise of a familiar RF circuit arrangement. |

The shape guides placement only. The network determines which ports connect and which symbols appear. Each guided board must account for all component occurrences and accept the actual network structure. Adding stages does not automatically mean an existing board supports them.

The current guided nodal boards represent junctions with explicit components such as `Tee()` or `mtee()`. Their wire nodes join two terminals, counting external terminals. The generic board also handles implicit shared-node junctions.

## Single-shape calls

```js
var drawing = nP.schematic(network, {
  shapes: ['powerDivider'],
  mount: '#drawing'
});
```

`mount` is optional and defaults to the document body. With no shape guidance, a nodal network uses the generic ORI board:

```js
var drawing = nP.schematic(network);
```

Omitting the shape does **not** search the named shapes for a match. Automatic selection among registered shapes is deferred. The generic board does recognize an unbranched two-port chain and reuses ORI's repeated component/wire tiles, but it does not select the named `series` board. Cascade and signal-path drawings retain their separate series-layout route; they accept `series` guidance rather than the other nodal shapes.

For example, `nP.schematic(network, {shapes: ['series']})` checks for one continuous two-port path. `nP.schematic(network, {shapes: ['ladder']})` checks for junction-led shunts that end in one-port terminations. Both accept ideal transmission-line and microstrip parts when their symbols and connections fit the board. Canonical port geometry determines quarter-turn rotations and reflections.

If the network does not fit a requested shape, the public `nP.schematic()` displays an inline error and returns `{svg: null, graph: null, topology: null, error}`. Subsequent JavaScript continues. Successful calls return `{svg, graph, topology, error: null}`. The source-module inspection helpers can still throw; the inline error boundary belongs to the public browser function.

`nP.schematic(network, {shapes: ['branchline']})` checks for a rectangular chain of cells. The `nodal()` output must have four ports, ordered top-left, top-right, bottom-right, bottom-left for the drawing. Each corner or shared junction uses a three-port symbol with through and branch port metadata, such as `Tee()` or `mtee()`. Each arm must contain at least one two-port component; `Tlin()` and `mlin()` are the normal line arms. A series component inside an arm is allowed. The renderer traces the arms from the nodal connections, rotates or reflects symbols to meet their actual ports, and reports an error if it cannot draw those connections as rectangles. The development harness includes one-cell ideal and microstrip examples and a two-cell ideal example.

## Bridged-T coverage

`shapes: ['bridgedT']` requires a two-port network with a main path, at least one upper bridge and at least one terminated downward shunt. The board data adds `match.connections` between unused main-path ports and `board.connections` for their repeated tiles, direction and clearance. ORI binds the bridges before consuming the remaining unused ports as terminated attachments. Every component must be accounted for.

Main-path wire spacing grows when needed to fit a bridge's actual symbol spans and wire boxes. Upper track spacing comes from component bounds; disjoint intervals can share a track, and shorter intervals are placed inside enclosing ones. Both ends use the common corner-wire operation. These are shared interpreter operations, not a bridged-T-specific JavaScript helper. A data-only variation can reverse the connection and attachment directions.

`Tee()`/`mtee()` use their declared through ports. For junctions without that declaration, ORI derives straight opposite pairs from canonical geometry. The `Tee4()` examples use ports 2/4 horizontally, port 3 for the upper bridge and port 1 for the downward shunt. Paths accept straight two-port symbols, including ideal transmission lines, microstrip lines and upstream network blocks; bend-following bridged paths are not part of this first definition. The board has a single-node input/output interface for composition.

## Edge-coupled filter coverage

`shapes: ['edgeCoupledFilter']` accepts a path of one or more ideal or microstrip coupled sections using numbered terminal pairs 1/3 or 3/1. The two unused ports of every section must have direct one-port terminations in the nodal network. Open-ended sections are the ordinary filter arrangement; short and load symbols are also supported when explicitly present. The first board does not include intermediate two-port parts along the connections or termination arms.

Allowed `portPairs` and the repeated tile's `orientation: {terminals: 'leads', advance: 'down'}` are data. ORI follows the canonical lead direction at each input and output. Their vertical separation creates the staircase, while `direction: 'terminal'` lets unused-port terminations face outward. The shared attachment-spacing operation calculates wire growth from actual body bounds and clearance. Neither the matcher nor the placement code tests an RF constructor name.

```js
nP.schematic(network, {
  shapes: ['edgeCoupledFilter'],
  flipVertical: true
});
```

The boolean `flipVertical` option reflects an ORI drawing about y = 0 before annotations are placed. All node numbers and numbered terminal connections remain unchanged. It also applies to other ORI nodal boards and complete board compositions, including series/ladder sections. Cascade and signal-path drawings do not support it. Dense annotation groups can use the common wider search fallback after the bounded search fails. The board has a single-node input/output interface for composition.

## Power-divider variants

`shapes: ['powerDivider']` tries the transformer description first, then the Wilkinson alternative. This is selection within an explicitly requested family; it does not enable automatic shape selection for an unguided network.

| Variant | Engineering layout intent and current coverage |
| --- | --- |
| Transformer | A two-port `trf()` feeds the center tap of `trfAuto()`. Its two winding ends feed output tees, whose common ports connect to an isolation resistor. Named slots describe these five components, relative positions and terminal directions. A centerline relation aligns the input transformer and center tap with the resistor midpoint. The drawing reports `pattern: 'transformer'`. |
| Wilkinson | An input `Tee()` or `mtee()` splits into upper and lower arms, each containing one or more two-port components. Two output junctions connect their arms to ports 2 and 3; their common ports face inward toward the isolation resistor lane. The lane accepts resistor components. Three junction cells and turning lanes describe the arrangement. The longest arm sets the horizontal pitch; the isolation lane sets the vertical separation. The drawing reports `pattern: 'wilkinson'`. |

The transformer description uses ORI's named-slot operations. Wilkinson uses its shared connected-lane operations, with named junction cells and independently measured horizontal and vertical spacing. Both use common wire/corner boxes, canonical symbols, orientation, annotation and SVG operations. Neither has a dedicated JavaScript drawing helper.

The current Wilkinson board covers a single two-way divider. Multistage and resistive power-divider descriptions have not been added.

## Power-combiner reuse

Both transformer and Wilkinson arrangements can be requested as `shapes: ['powerCombiner']`. The definition contains `use: 'powerDivider'` and `transform: {mirrorX: true}`. ORI binds the referenced board and reflects its complete layout about the vertical axis through x = 0. It preserves electrical port numbers: port 1 is the common output on the right, port 2 the upper input on the left and port 3 the lower input on the left. The resulting graph reports `shape: 'powerCombiner'`, `layout: 'powerCombiner'` and the referenced variant's `pattern`.

The shared board-reference and reflection operations transform symbol orientations, terminal coordinates, wires, node dots and external ports together before annotation placement. They also support `mirrorY` for reflection about the horizontal axis. The source board and network remain unchanged. Unknown references and reference cycles report errors. This is reuse through board data, not a dedicated JavaScript combiner layout helper.

## Multiple shapes in one network

The divider/combiner/ladder example in [powerDivider.html](../dev/shapes/powerDivider.html) puts all seventeen component occurrences in one `nodal()` call:

```js
nP.schematic(network, {
  shapes: [
    {name: 'powerDivider', from: 1, to: [40, 41]},
    {name: 'powerCombiner', from: [40, 41], to: 50},
    {name: 'ladder', from: 50, to: 2}
  ]
});
```

Nodes 40 and 41 connect the upper and lower paths; node 50 connects the combiner to the ladder. These are existing electrical node numbers, not coordinates or numeric ranges. `schematicBoardComposition.js` supplies ORI's shared composition operation. It isolates each section at the supplied boundaries, interprets the existing board, aligns adjacent interface wire endpoints and merges the geometry into one drawing graph. Internal interface ports are removed from the final external-port list. All components must belong to exactly one section.

Board data declares which numbered ports belong to each interface. `powerDivider` declares `interface: {from: [1], to: [2, 3]}`; `powerCombiner` declares `interface: {from: [2, 3], to: [1]}`. `series` and `ladder` have one port on each side; `branchline` declares left ports 1/4 and right ports 2/3. A `use` reference can inherit this interface or override it as the combiner does.

Sections must be supplied in connected input-to-output order and use the same placement grid. Shared interfaces must have matching port spacing and ordering so translation can join corresponding wire endpoints. A mismatch reports an error; the composer does not stretch symbols or silently change connections. Branching section hierarchies and automatic adjustment of incompatible interfaces remain future work. `drawing.graph.board.sections` records the names, boundaries, selected variants and component occurrence IDs.

### Series followed by ladder

For two sections in one nodal network, identify their endpoints by the node numbers already used in `nodal()`:

```js
nP.schematic(network, {
  shapes: [
    {name: 'series', from: 1, to: 4},
    {name: 'ladder', from: 4, to: 11}
  ]
});
```

The shared node `4` joins the sections. The first `from` and final `to` must be the network's external input and output nodes. The series section must contain a nonempty two-port path; the ladder section must include at least one terminated downward shunt. Node-bounded composition does not apply to a cascade without nodal node numbers.

This pair uses the same ORI composition operation as other node-bounded board sections. `drawing.graph.shapes` preserves the supplied section descriptions; `drawing.graph.board.sections` adds their component occurrence IDs. Components in a composed drawing retain the nodal input-row order. Invalid cuts report the common composition errors. A bare list such as `['series', 'ladder']` is not accepted: section boundaries must be supplied.

## Proposed capabilities: not implemented

### Next shapes, in suggested order

These are proposed engineering arrangements, not accepted shape names in the current API. They should be expressed through board definitions interpreted by ORI, without a dedicated JavaScript matching or layout helper for each shape.

| Shape name | Engineering appearance and scope |
| --- | --- |
| `amplifier` | An amplifier occupies the main left-to-right path, with input/output matching and bias networks arranged around it. Supports multiple stages. |
| `balancedAmplifier` | An input hybrid feeds two amplifier tracks, followed by an output hybrid. Corresponding tracks receive symmetrical spacing. |
| `filterBank` | A common junction feeds several filter tracks ending at separate ports, as in diplexers and triplexers. Also accommodates the reversed combining arrangement. |
| `bridge` | Upper and lower paths with one or more cross-connections between them. Covers bridge networks that do not fit the simpler `bridgedT` arrangement. |

### Extensions to existing shapes

- `powerDivider`: add the resistive version, then multistage and unequal divisions.
- `powerDivider` and `powerCombiner`: cover splitting into multiple tracks and rejoining them, including different shapes along individual tracks. This replaces the earlier separate `splitRejoin` proposal.
- `branchline`: accommodate the square presentation of rat-race rings and additional components along each arm. Added series components are already supported in the current branchline arrangement; other ring structures need further coverage.
- `ladder`: exercise multistage LC filters, several components between tees, several components down a shunt, unequal shunt lengths, transmission-line stub networks, and upstream two-port network blocks mixed with individual components before deciding another shape is necessary.

Circuit function alone does not establish its shape. A filter, matching network, limiter or bias network fits `ladder` when its actual connections fit the main-path and terminated-shunt arrangement. A bridge across different main-path positions remains a separate arrangement even when each arm contains several components.

ORI now composes ordered board sections within one network. Further composition work is needed for nested tracks, such as a ladder on one divider output and a series arrangement on another before recombination.

## Development examples

| Page | Current coverage |
| --- | --- |
| [series.html](../dev/shapes/series.html) | Two-port chains, bends and upstream networks as blocks |
| [ladder.html](../dev/shapes/ladder.html) | Ideal transmission-line and microstrip ladders |
| [bridgedT.html](../dev/shapes/bridgedT.html) | Resistive and multi-component bridges, Tee4 junctions, repeated sections and microstrip parts |
| [edgeCoupledFilter.html](../dev/shapes/edgeCoupledFilter.html) | Ideal/microstrip staircases, vertical flip, seven-section repetition and alternative terminations |
| [branchline.html](../dev/shapes/branchline.html) | Ideal and microstrip rings, multiple cells and extra series arm components |
| [powerDivider.html](../dev/shapes/powerDivider.html) | Wilkinson variants plus a divider/combiner/ladder in one nodal network with three guided board sections |
| [powerCombiner.html](../dev/shapes/powerCombiner.html) | Reflected transformer and Wilkinson arrangements, microstrip symbols and unequal arm component counts |
| [trf5Port.html](../dev/trf5Port.html) | Guided transformer divider, followed by a single-nodal splitter/combiner test using the generic board |
| [schematic.html](../dev/schematic.html) | Broader default-layout exposure through the generic nodal board and existing cascade layout |

The splitter/combiner test in `trf5Port.html` remains an unguided baseline. The example in `powerDivider.html` demonstrates composition of three guided boards.

See [schematicSystem.md](schematicSystem.md) for ORI's execution order, graph and topology structures, symbol bundling, routing, and rendering.
